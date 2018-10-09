// (c) Copyright 2017-2018 SUSE LLC
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
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { fetchJson, postJson, deleteJson } from '../../utils/RestUtils.js';
import { ErrorMessage, InfoBanner } from '../../components/Messages.js';
import { ValidatingInput } from '../../components/ValidatingInput.js';

class EditTemplateFile extends Component {
  constructor(props) {
    super(props);
    this.state = {original: '', contents: ''};
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/service/files/' +  this.props.editFile)
      .then((response) => {
        this.setState({original: response, contents: response});
        if (this.props.revertable) {
          fetchJson('/api/v1/clm/service/files/' +  this.props.editFile + '.bak')
            .then((response) => {
              this.setState({original: response});
            })
            .catch((error) => {
              // it's ok to not have the original file
            });
        }
      });
  }

  handleSaveEdit = () => {
    if (this.props.revertable) {
      const origFile = this.props.editFile + '.bak';
      if (this.state.original !== this.state.contents) {
        // preserve original content into a backup file (only once) for a reversion later on
        fetchJson('/api/v1/clm/service/files/' +  origFile)
          .catch((error) => {
            postJson('/api/v1/clm/service/files/' + origFile, JSON.stringify(this.state.original));
          });
        postJson('/api/v1/clm/service/files/' + this.props.editFile, JSON.stringify(this.state.contents));
        this.props.changeAction(true);
      } else {
        // update the file and remove backup file if new content is the same as original content
        postJson('/api/v1/clm/service/files/' +  this.props.editFile, JSON.stringify(this.state.original))
          .then(() => {deleteJson('/api/v1/clm/service/files/' +  origFile);});
        this.props.changeAction(false);
      }
    } else {
      postJson('/api/v1/clm/service/files/' + this.props.editFile, JSON.stringify(this.state.contents));
    }
    this.props.closeAction();
  }

  handleChange = (event) => {
    this.setState({contents: event.target.value});
  }

  handleCancel() {
    this.props.closeAction();
  }

  render() {
    return (
      <div className='edit-container file-editor'>
        <ValidatingInput
          inputValue={this.state.contents}
          inputName='fileContents'
          inputType='textarea'
          inputAction={this.handleChange}
        />
        <div className='btn-row'>
          <ActionButton type='default'
            displayLabel={translate('cancel')}
            clickAction={() => this.handleCancel()}/>
          <ActionButton
            displayLabel={translate('save')}
            clickAction={() => this.handleSaveEdit()}/>
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

      // which file is in edit
      editFile: undefined,

      // the service name of the file in editing
      editServiceName: undefined,

      // expanded services
      expandedServices: [],

      // for error message
      errorContent: undefined
    };
  }

  componentWillMount() {
    //retrieve a list of j2 files for services
    fetchJson('/api/v1/clm/service/files')
      .then((responseData) => {
        this.setState({serviceFiles: responseData});
      })
      .catch((error) => {
        this.setState({
          errorContent: {
            messages: [
              translate('validate.config.service.getfiles.error'), error.toString()
            ]
          }
        });
      });
  }

  handleEditFile = (seviceName, file) => {
    this.setState({editServiceName: seviceName, editFile: file});
    this.props.showNavButtons(false);
    this.props.disableTab(true);
  }

  hasChange = (list) => {
    let count = 0;
    list.map((l) => {
      if (l.changedFiles) {
        count += l.changedFiles.length;
      }
    });
    return count > 0;
  }

  recordChangedFile = (contentChanged) => {
    const updatedList = this.state.serviceFiles.map((val) => {
      if (val.service === this.state.editServiceName) {
        const newChangedFiles = val.changedFiles ? val.changedFiles.slice() : [];
        val.files.map((file) => {
          if (file === this.state.editFile) {
            if (contentChanged) {
              newChangedFiles.push(file);
            } else {
              newChangedFiles.splice(newChangedFiles.indexOf(file), 1);
            }
          }
        });

        if (newChangedFiles.length > 0) {
          val.changedFiles = newChangedFiles;
        } else {
          delete val.changedFiles;
        }
      }
      return val;
    });
    this.setState({serviceFiles: updatedList});
    this.props.hasChange(this.hasChange(updatedList));
  }

  removeOrigFiles = () => {
    this.state.serviceFiles.map((val) => {
      if (val.changedFiles) {
        val.changedFiles.map((file) => {
          const filename = val.service + '/' + file + '.bak';
          deleteJson('/api/v1/clm/service/files/' +  filename);
        });
      }
    });
  }

  revertChanges = () => {
    const revertedList = this.state.serviceFiles.map((val) => {
      if (val.changedFiles) {
        val.changedFiles.map((file) => {
          const filename = val.service + '/' + file;
          // fetch original content, write it out to the current file, then remove the original copy
          fetchJson('/api/v1/clm/service/files/' +  filename + '.bak')
            .then((response) => {
              postJson('/api/v1/clm/service/files/' + filename, JSON.stringify(response))
                .then(() => {deleteJson('/api/v1/clm/service/files/' +  filename + '.bak');});
            });
        });
        delete val.changedFiles;
      }
      return val;
    });
    this.setState({serviceFiles: revertedList});
    this.props.hasChange(false);
  }

  handleCloseEdit = () => {
    this.setState({editFile: undefined, editServiceName: undefined});
    this.props.showNavButtons(true);
    this.props.disableTab(false);
  }

  handleToggleService = (item) => {
    item.expanded = !item.expanded;
    if(item.expanded) {
      let openIndex = this.state.expandedServices.findIndex((itm) => {
        return itm.service === item.service;
      });
      let openS = this.state.expandedServices.slice();
      openS.splice(openIndex, 1);
      this.setState({expandedServices: openS});
    }
    else {
      let openS = this.state.expandedServices.slice();
      openS.push(item);
      this.setState({expandedServices: openS});
    }
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

  renderFileSection() {
    if(this.state.editFile) {
      return (
        <div>
          <h3>{this.state.editServiceName + ' - ' + this.state.editFile}</h3>
          <EditTemplateFile closeAction={this.handleCloseEdit} changeAction={this.recordChangedFile}
            editFile={this.state.editServiceName + '/' + this.state.editFile}
            revertable={this.props.revertable}/>
        </div>
      );
    }
    else {
      let desc = translate('validate.config.service.info');
      return (<div className='col-xs-6'><InfoBanner message={desc}/></div>);
    }
  }

  renderFileList(index, item) {
    if(item.expanded) {
      let fileList = [];
      item.files
        .sort((a, b) => alphabetically(a, b))
        .map((file, idx) => {
          let isChanged = false;
          if (item.changedFiles) {
            isChanged = item.changedFiles.indexOf(file) !== -1;
          }
          fileList.push(
            <li key={idx}>
              <ActionButton type='clickable' clickAction={() => this.handleEditFile(item.service, file)}
                displayLabel={file + (isChanged ? ' *' : '')}/>
            </li>
          );
        });
      return (
        <li key={index}>
          <span className='service-heading' onClick={() => this.handleToggleService(item)}>
            <i className='material-icons'>keyboard_arrow_down</i>{item.service}</span>
          <ul className='file-list'>{fileList}</ul>
        </li>
      );
    }
    else { // when service not expanded
      return (
        <li key={index}>
          <span className='service-heading' onClick={() => this.handleToggleService(item)}>
            <i className='material-icons'>keyboard_arrow_right</i>{item.service}</span>
        </li>
      );
    }
  }

  renderServiceList() {
    let serviceList = [];
    this.state.serviceFiles && this.state.serviceFiles
      .sort((a,b) => alphabetically(a['service'], b['service']))
      .forEach((item, index) => {
        if(item.files && item.files.length > 0) {
          if(item.expanded === undefined) {
            item.expanded = false;
          }
          serviceList.push(this.renderFileList(index, item));
        }
      });

    return (
      <div className='col-xs-6 verticalLine'>
        <ul className='all-service-list'>{serviceList}</ul>
      </div>
    );
  }

  render() {
    return (
      <div className='template-service-files'>
        <div>
          {!this.state.editFile && this.renderServiceList()}
          {this.renderFileSection()}
        </div>
        {this.renderErrorMessage()}
      </div>
    );
  }
}

export default ServiceTemplatesTab;
