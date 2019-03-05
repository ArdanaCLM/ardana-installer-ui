// (c) Copyright 2018 SUSE LLC
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
import { isEmpty } from 'lodash';
import { translate } from '../localization/localize.js';
import { alphabetically } from '../utils/Sort.js';
import { fetchJson, isCloudConfigEncrypted} from '../utils/RestUtils.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ErrorMessage } from '../components/Messages.js';
import { SearchBar } from '../components/ServerUtils.js';
import { SetEncryptKeyModal } from '../components/Modals.js';
import { getCachedEncryptKey, setCachedEncryptKey } from '../utils/MiscUtils.js';


class ArdanaPackages extends Component {

  constructor() {
    super();
    this.state = {
      packages: undefined,
      error: undefined,
      showLoadingMask: false,
      searchText: '',
      // deal with encryptKey
      showEncryptKeyModal: false
    };
  }

  async componentWillMount() {
    let isEncrypted = await isCloudConfigEncrypted();
    let enKey = getCachedEncryptKey();
    if(isEncrypted && isEmpty(enKey)) {
      // Use the cached global var encryptKey so we don't
      // prompt every time when access this page
      this.setState({showEncryptKeyModal: true});
    }
    else {
      this.getPackages(enKey);
    }
  }

  handleEncryptKey =  (enKey) => {
    this.setState({showEncryptKeyModal: false});
    setCachedEncryptKey(enKey);
    this.getPackages(enKey);
  }

  getPackages = (encryptKey) => {
    this.setState({showLoadingMask: true});
    let extraParams = undefined;
    if(!isEmpty(encryptKey)) {
      extraParams = {headers: {'encrypt': encryptKey}};
    }
    fetchJson('/api/v2/packages', extraParams)
      .then(responseData => {
        this.setState({packages: responseData.cloud_installed_packages, showLoadingMask: false});
      })
      .catch((error) => {
        this.setState({
          error: {
            title: translate('default.error'),
            messages: [translate('services.package.unavailable')]
          },
          showLoadingMask: false
        });
      });
  }

  renderErrorMessage() {
    if (this.state.error) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({error: undefined})}
            title={this.state.error.title}
            message={this.state.error.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  handleSearch = (filterText) => {
    this.setState({searchText: filterText});
  }

  renderEncryptKeyModal() {
    return (
      <If condition={this.state.showEncryptKeyModal}>
        <SetEncryptKeyModal title={translate('warning')}
          doneAction={this.handleEncryptKey}>
        </SetEncryptKeyModal>
      </If>
    );
  }

  render() {
    let rows = [];
    if (this.state.packages) {
      rows = this.state.packages
        .sort((a,b) => alphabetically(a.name, b.name))
        .map((pkg) => {
          if (pkg.name.includes(this.state.searchText) || pkg.versions.join(', ').includes(this.state.searchText)) {
            return (
              <tr key={pkg.name}>
                <td>{pkg.name}</td>
                <td>{pkg.versions.join(', ')}</td>
              </tr>
            );
          }
        });
    }

    return (
      <div>
        {this.renderErrorMessage()}
        {this.renderEncryptKeyModal()}
        <LoadingMask show={this.state.showLoadingMask}></LoadingMask>
        <div className='menu-tab-content'>
          <div className='header-row'>
            <div className='header'>{translate('services.header.packages.installed')}</div>
            <div className='search-group'>
              <SearchBar filterText={this.state.searchText} filterAction={this.handleSearch}
                placeholder={'search'}/>
            </div>
          </div>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('name')}</th>
                <th>{translate('services.version')}</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

}

export default ArdanaPackages;
