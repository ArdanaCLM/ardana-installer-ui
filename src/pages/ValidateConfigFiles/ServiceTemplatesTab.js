// (c) Copyright 2017-2019 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React, { Component } from 'react';

import { translate } from '../../localization/localize.js';
import { ActionButton, LoadFileButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { fetchJson, postJson, deleteJson } from '../../utils/RestUtils.js';
import { ErrorMessage, InfoBanner } from '../../components/Messages.js';
import { ValidatingInput } from '../../components/ValidatingInput.js';
import HelpText from '../../components/HelpText.js';
import { getCachedEncryptKey, readFile } from '../../utils/MiscUtils.js';

class EditTemplateFile extends Component {
  constructor(props) {
    super(props);
    this.state = {original: '', contents: '', loading: true};
  }

  componentWillMount() {
    this.setState({ loading: true });
    this.loadFileContent();
  }

  componentWillReceiveProps(props) {
    if(this.props.fileLoadTime !== props.fileLoadTime) {
      this.loadFileContent();
    }
  }

  loadFileContent = () => {
    fetchJson('/api/v2/service/files/' +  this.props.editFile)
      .then((response) => {
        this.setState({original: response, contents: response});
        if (this.props.revertable) {
          fetchJson('/api/v2/service/files/' +  this.props.editFile + '.bak')
            .then((response) => {
              this.setState({original: response});
            }).catch((error) => {
              // it's ok to not have the original file
            }).finally(() => {
              this.setState({ loading: false });
            });
        } else {
          this.setState({ loading: false });
        }
      });
  }

  async handleSaveEdit() {
    const changed = (this.state.original !== this.state.contents);
    if (this.props.revertable) {
      const origFile = this.props.editFile + '.bak';
      if (changed) {
        // preserve original content into a backup file (only once) for a reversion later on
        try {
          await fetchJson('/api/v2/service/files/' +  origFile);
        }
        catch(error) {
          await postJson('/api/v2/service/files/' + origFile, JSON.stringify(this.state.original));
        }
        await postJson('/api/v2/service/files/' + this.props.editFile, JSON.stringify(this.state.contents));
      } else {
        // update the file and remove backup file if new content is the same as original content
        await postJson('/api/v2/service/files/' +  this.props.editFile, JSON.stringify(this.state.original));
        await deleteJson('/api/v2/service/files/' +  origFile);
      }
    } else {
      await postJson('/api/v2/service/files/' + this.props.editFile, JSON.stringify(this.state.contents));
    }
    this.props.changeAction?.(changed);
    this.props.closeAction(changed);
  }

  handleChange = (event) => {
    this.setState({contents: event.target.value});
  }

  handleCancel() {
    this.props.closeAction(false);
  }

  render() {
    return (
      <div className='edit-container file-editor'>
        <Choose>
          <When condition={this.state.loading}>
            <h3>{translate('loading.pleasewait')}</h3>
          </When>
          <Otherwise>
            <ValidatingInput
              inputValue={this.state.contents}
              inputName='fileContents'
              inputType='textarea'
              inputAction={this.handleChange}
            />
          </Otherwise>
        </Choose>
        <div className='btn-row'>
          <ActionButton type='default'
            displayLabel={translate('cancel')}
            clickAction={() => this.handleCancel()}/>
          <ActionButton
            displayLabel={translate('save')}
            clickAction={::this.handleSaveEdit}/>
        </div>
      </div>
    );
  }
}

class ServiceTemplatesTab extends Component {
  constructor(props) {
    super(props);
    this.state = {

      // List of files like :
      // [{service: 'cinder', files: ['api-cinder.conf.j2', 'api.conf.j2']}]
      serviceFiles: undefined,

      // Object of changed files.  The key is the service name, and the value is a set of
      // files in that service that have changed
      changedFiles: {},

      //used to determine if the edit dialog needs to be reloaded because the files have been
      //refreshed, after a revert for example
      fileLoadTime: undefined,

      // which file is in edit
      editFile: undefined,

      // the service name of the file in editing
      editServiceName: undefined,

      // set of service names that are expanded
      expandedServices: new Set(),

      // for error message
      errorContent: undefined,

      //deal with encryptKey
      encryptKey: getCachedEncryptKey() || '',

      // is SES configured completely?
      sesConfigured: undefined,

      // SES config path indicated by ses/settings.yml
      sesConfigPath: undefined,
    };
  }

  componentWillMount() {
    this.populateForm();
    // Whenever the screen is first shown (or re-shown after an update), clear
    // the enableSes status to avoid SES being unnecessarily re-deployed
    this.props.enableSes?.(false);
  }

  populateForm() {
    this.setState({
      loading: true
    });
    let promises = [];
    //retrieve a list of files for services
    promises.push(fetchJson('/api/v2/service/files')
      .then((responseData) => {
        this.setState({serviceFiles: responseData, fileLoadTime: Date.now()});
      })
      .catch((error) => {
        this.setState({
          errorContent: {
            messages: [
              translate('validate.config.service.getfiles.error'), error.toString()
            ]
          }
        });
      }));
    promises.push(fetchJson('/api/v2/ses/configure')
      .then((response) => {
        this.setState({
          sesConfigured: response.ses_configured,
          sesConfigPath: response.ses_config_path
        });
      }));
    return Promise.all(promises).then(() => {
      this.setState({ loading: false });
    });
  }

  handleEditFile = (serviceName, file) => {
    this.setState({editServiceName: serviceName, editFile: file});
    this.props.showNavButtons(false);
    this.props.disableTab(true);
  }

  hasChange = () => Object.values(this.state.changedFiles).some(s => s.size > 0);

  async recordChangedFile(contentChanged, service, file) {
    // Captures the fact the the given service/file was changed (or became unchanged)
    // If no service or file is specified, then this is being called in a situation
    // such EditTemplateFile where the state already contains editServiceName and
    // editFile.
    // If any of the ses configuration has changed, then re-query the back-end to
    // see whether to remember that ses has been enabled.

    const changedService = service || this.state.editServiceName;
    const changedFile = file || this.state.editFile;

    // If the ses settings or config has changed, set enableSes accordingly
    if (contentChanged && changedService === 'ses') {
      const response = await fetchJson('/api/v2/ses/configure');
      this.setState({
        sesConfigured: response.ses_configured,
        sesConfigPath: response.ses_config_path,
      });
      this.props.enableSes?.(response.ses_configured);
    }

    this.setState(prevState => {

      let newSet = new Set(prevState.changedFiles[changedService] || []);
      if (contentChanged) {
        newSet.add(changedFile);
      } else {
        newSet.delete(changedFile);
      }

      // Create a new object with all of the same keys and values, but with the new
      // changes applied
      let newChanged = Object.assign({}, prevState.changedFiles, {[changedService]: newSet});
      return {changedFiles: newChanged};
    }, () => this.props.hasChange?.(this.hasChange()));
  }

  getChangedServices = () => {
    return this.state.serviceFiles.map(srv => srv.service)
      .filter(srv => this.state.changedFiles[srv]?.size > 0);
  }

  removeOrigFiles = () => {
    for (let [service, fileList] of Object.entries(this.state.changedFiles)) {
      for (let file of fileList) {
        const filename = service + '/' + file + '.bak';
        deleteJson('/api/v2/service/files/' +  filename);
      }
    }
  }

  revertChanges = () => {
    for (let [service, fileList] of Object.entries(this.state.changedFiles)) {
      for (let file of fileList) {
        const filename = service + '/' + file;
        // fetch original content, write it out to the current file, then remove the original copy
        fetchJson('/api/v2/service/files/' +  filename + '.bak')
          .then((response) => {
            postJson('/api/v2/service/files/' + filename, JSON.stringify(response))
              .then(() => {
                // If reverting ses/settings.yml, trigger a reload of the list
                if (filename === 'ses/settings.yml') {
                  this.populateForm();
                  this.props.enableSes?.(false);
                }
                deleteJson('/api/v2/service/files/' +  filename + '.bak');
              });
          });
      }
    }
    this.setState({changedFiles: {}, fileLoadTime: Date.now()});
    this.props.hasChange?.(false);
  }

  async handleCloseEdit(changed=false) {
    const need_reload = changed && this.state.editServiceName === 'ses';
    // It is important to clear out editServiceName and editFile before reloading, because while
    // the reload is happening, the page may attempt to re-render and trigger ReactJS errors
    this.setState({editFile: undefined, editServiceName: undefined});
    if (need_reload) {
      await this.populateForm();
    }
    this.props.showNavButtons(true);
    this.props.disableTab(false);
  }

  async handleSesUpload(file) {
    // Handle uploading a new file.  Note that in this situation the containing component will
    // not call recordChangedFile nor handleCloseEdit
    this.setState({
      loading: true,
    });
    try {
      const fileContents = await readFile(file);
      await postJson('/api/v2/service/files/ses/' + this.state.sesConfigPath, JSON.stringify(fileContents));
      this.recordChangedFile(true, 'ses', file.name);  // also calls hasChange() and enableSes()

      // Reload the list of files to reflect the fact that a new ses config
      // file is available which may (or may not) be in the directory of config
      // files and may (or may not) contain valid yaml
      this.populateForm();

    } catch(error) {
      this.setState({
        loading: false,
        errorContent: {
          messages: [
            translate('upload.ses_file.failure'), error.toString()
          ]
        }
      });
    }
  }


  handleToggleService = (item) => {
    this.setState((prevState) => {
      let newExpanded = new Set(prevState.expandedServices);
      if (newExpanded.has(item.service)) {
        newExpanded.delete(item.service);
      } else {
        newExpanded.add(item.service);
      }
      return {expandedServices: newExpanded};
    });
  }

  handleEncryptKeyChange = (e) => {
    e.preventDefault();
    this.setState({encryptKey: e.target.value});
    this.props.handleEncryptKey(e.target.value);
  }

  renderErrorMessage() {
    if (this.state.errorContent) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({errorContent: undefined})}
            message={this.state.errorContent.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  renderEncryptKey() {
    return (
      <If condition={this.props.handleEncryptKey !== undefined}>
        <div className='encryptkey-container'>
          <div className='detail-line'>
            <div className='detail-heading'>
              {translate('validate.deployment.encryptKey') + '*'}
              <HelpText tooltipText={translate('validate.deployment.encryptKey.tooltip')}/>
            </div>
            <div className='input-body'>
              <ValidatingInput isRequired='true' inputName='encryptKey'
                inputType='password' inputValue={this.state.encryptKey}
                inputAction={this.handleEncryptKeyChange}/>
            </div>
          </div>
        </div>
      </If>
    );
  }

  renderFileSection() {
    if(this.state.editFile) {
      return (
        <div className='col-12'>
          <h3>{this.state.editServiceName + ' - ' + this.state.editFile}</h3>
          <EditTemplateFile closeAction={::this.handleCloseEdit} changeAction={::this.recordChangedFile}
            editFile={this.state.editServiceName + '/' + this.state.editFile}
            fileLoadTime={this.state.fileLoadTime}
            revertable={this.props.revertable}/>
        </div>
      );
    }
    else {
      let desc = translate('validate.config.service.info');
      return (
        <div className='col-6'>
          <InfoBanner message={desc}/>
          <p />
          {this.renderEncryptKey()}
        </div>);
    }
  }

  renderFileList(item) {
    if(this.state.expandedServices.has(item.service)) {
      let fileList = [];
      item.files
        .sort((a, b) => alphabetically(a, b))
        .map(file => {
          const isChanged = this.state.changedFiles[item.service]?.has(file);
          fileList.push(
            <li key={file}>
              <a onClick={() => this.handleEditFile(item.service, file)}>{file + (isChanged ? ' *' : '')}</a>
            </li>
          );
        });
      // Add a button to upload a SES config file
      if(item.service === 'ses' && this.state.sesConfigPath && ! this.state.sesConfigured) {
        fileList.push(
          <li className='file-upload' key='upload_file'>
            <LoadFileButton
              displayLabel={translate('upload.ses_file')}
              extensions=".yml"
              clickAction={::this.handleSesUpload} />
          </li>
        );
      }
      return (
        <li key={item.service}>
          <span className='service-heading' onClick={() => this.handleToggleService(item)}>
            <i className='material-icons'>keyboard_arrow_down</i>{item.service}</span>
          <ul className='file-list'>{fileList}</ul>
        </li>
      );
    }
    else if (item.files?.length > 0) { // when service not expanded
      return (
        <li key={item.service}>
          <span className='service-heading' onClick={() => this.handleToggleService(item)}>
            <i className='material-icons md-dark'>keyboard_arrow_right</i>{item.service}</span>
        </li>
      );
    }
  }

  renderServiceList() {
    const serviceList = this.state.serviceFiles
      ?.sort((a,b) => alphabetically(a['service'], b['service']))
      ?.map(svc => this.renderFileList(svc));

    return (
      <div className='col-6 verticalLine'>
        <ul className='all-service-list'>{serviceList}</ul>
      </div>
    );
  }

  render() {
    return (
      <div className='template-service-files'>
        <div className='row'>
          {!this.state.editFile && this.renderServiceList()}
          {!this.state.loading && this.renderFileSection()}
        </div>
        {this.renderErrorMessage()}
      </div>
    );
  }
}

export default ServiceTemplatesTab;
