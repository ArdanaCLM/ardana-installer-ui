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
import { translate } from '../localization/localize.js';

export function BackButton(props) {
  return (
    <ActionButton type='default'
      clickAction={props.clickAction}
      displayLabel={props.displayLabel || translate('back')}
      isDisabled={props.isDisabled}
    />
  );
}

export function NextButton(props) {
  return (
    <ActionButton
      clickAction={props.clickAction}
      displayLabel={props.displayLabel || translate('next')}
      isDisabled={props.isDisabled}
    />
  );
}

export function CloseButton(props) {
  return (
    <ActionButton
      clickAction={props.clickAction}
      displayLabel={props.displayLabel || translate('close')}
      isDisabled={props.isDisabled}
    />
  );
}

export function CancelButton(props) {
  return (
    <ActionButton type='default'
      clickAction={props.clickAction}
      displayLabel={props.displayLabel || translate('cancel')}
      isDisabled={props.isDisabled}
    />
  );
}

export class ActionButton extends Component {
  render() {
    let buttonClass = 'btn ' + (this.props.type ? 'btn-' + this.props.type + ' ' : 'btn-primary ') +
      (this.props.isDisabled ? ' disabled' : '');
    buttonClass += (this.props.lastButton) ? 'last-button' : '';
    buttonClass += (this.props.moreClass) ? 'inline-button' : '';
    return (
      <button
        id={this.props.id}
        className={buttonClass}
        onClick={this.props.clickAction}
        disabled={this.props.isDisabled}>{this.props.displayLabel}
      </button>
    );
  }
}


export class SubmitButton extends Component {
  render() {
    let buttonClass = 'btn ' + (this.props.type ? 'btn-' + this.props.type + ' ' : 'btn-primary ') +
      (this.props.isDisabled ? ' disabled' : '');
    buttonClass += (this.props.lastButton) ? 'last-button' : '';
    buttonClass += (this.props.moreClass) ? 'inline-button' : '';
    return (
      <button
        type="submit"
        className={buttonClass}
        disabled={this.props.isDisabled}>{this.props.displayLabel}
      </button>
    );
  }
}


export class LoadFileButton extends Component {
  // The standard html control for getting a filename from a user is <input type="file">,
  // and while this is just a single DOM element, it is actually rendered visually as both
  // a button and a text field.  The behavior of this control is that when the button is
  // clicked, it pops up a dialog to the the user select a filename, but does not actually
  // try to attempt to load that file (it just populates the text field).  The implied
  // expectation is that there would be a submit button on this page that would then act
  // on that filename.
  //
  // But the behavior we want is to have a button that lets the user select a filename,
  // and then immediately act on that selected file.  On the surface, it would seem that
  // we could somehow disable the text field, but it turns out that that is rather
  // difficult to accomplish.  Furthermore, the button that is rendered as part of the
  // file input is also difficult to style in a way that is consistent with other buttons.
  //
  // So instead we take a "tricky" approach of creating the file input as a hidden DOM
  // element, and render our own button (which is easy to style), and when our button is
  // clicked, we pass the click event along to the hidden input.  We also listen for the
  // change event on that hidden file input so that when a file is selected, we receive
  // that event and propagate it to the caller.
  onClickShownButton = (e) => {
    this.hiddenButton.click();
  }

  onFileSelected = (e) => {
    const file = e.target.files[0];

    // Reset the form, which clears out the filename from the hidden input.
    // Without this, if you were to press the button again and re-load the
    // same file, it would not trigger the input's onChange event, preventing
    // the file from being reloaded
    this.form.reset();

    if (file) {
      this.props.clickAction(file);
    }
  }

  render() {
    const hidden = { display: 'none' };
    const type = this.props.type ? this.props.type : 'link';
    return (
      <span>
        <ActionButton type={type}
          clickAction={this.onClickShownButton}
          displayLabel={this.props.displayLabel}
          isDisabled={this.props.isDisabled || false}
          lastButton='true'
        />
        <form ref={(form) => { this.form = form; }} >
          <input type="file"
            onChange={this.onFileSelected}
            accept={this.props.extensions || '.csv'}
            ref={(input) => { this.hiddenButton = input; }}
            style={hidden}
          />
        </form>
      </span>
    );
  }
}

export class PickerButton extends Component {
  render() {
    let classN = 'picker-card rounded-corner shadowed-border' +
      (this.props.isSelected ? ' selected' : '');
    let check = '';
    if(this.props.isSelected) {
      check = (<i className="material-icons model-check-icon">check_circle</i>);
    }
    return (
      <div className={classN} name={this.props.keyName}
        onClick={this.props.clickAction}>
        <p className='model-name' onClick={this.props.clickAction} name={this.props.keyName}>
          {this.props.displayLabel}</p>
        <p>{check}</p>
      </div>
    );
  }
}

export class ActivePickerButton extends Component {
  handleClick(e) {
    e.preventDefault();
    this.props.handleClick(e);
  }

  render() {
    let buttonClass = 'model-elements' + (this.props.isSelected ? ' model-element-selected' : '');
    let check = '';
    if(this.props.isSelected) {
      check = (<i className="material-icons model-check-icon">check_circle</i>);
    }
    return (
      <div className={buttonClass}>
        <div
          id={this.props.id}
          className='card rounded-corner shadowed-border'
          onClick={::this.handleClick}
          value={this.props.value} >
          <p className='card-text-unit' id={this.props.id} >
            {this.props.value}
          </p>
          <h4 id={this.props.id}>
            {this.props.description}
          </h4>
          <p>{check}</p>
        </div>
      </div>
    );
  }
}

export class ItemHelpButton extends Component {
  render() {
    return (
      <span className='helper' onClick={this.props.clickAction}>
        <i className="material-icons">info</i>
      </span>
    );
  }
}

export function AssignmentButton(props) {
  let cName = 'material-icons assignment-button';
  let iconName = '';
  if (props.type === 'right') {
    iconName = 'chevron_right';
    cName = cName + ' right-button';
  } else if (props.type === 'left') {
    iconName = 'chevron_left';
  } else if (props.type === 'double-right') {
    iconName = 'last_page';
  } else if (props.type === 'double-left') {
    iconName = 'first_page';
  }
  cName = (props.isDisabled === true) ? cName + ' disabled' : cName;
  return (
    <span onClick={props.clickAction}>
      <i className={cName}>{iconName}</i>
    </span>
  );
}


export class ItemMenuButton extends Component {
  render() {
    let showMenuAction = this.props.clickAction;
    let moreClass = this.props.className || '';
    let cName = 'material-icons ' + moreClass;
    return (
      <span name='itemMenuButton' onClick={showMenuAction}>
        <i className={cName}>more_vert</i>
      </span>
    );
  }
}

export class EditPencilForTableRow extends Component {
  render() {
    return (
      <td className='actions'>
        <p onClick={this.props.clickAction}>
          <span className='edit'>
            <i className="material-icons">edit</i>
          </span>
        </p>
      </td>
    );
  }
}

export class InfoForTableRow extends Component {
  render() {
    return (
      <td className='actions'>
        <p onClick={this.props.clickAction}>
          <span className='detail-info'>
            <i className='material-icons'>info</i>
          </span>
        </p>
      </td>
    );
  }
}

export class DeleteForTableRow extends Component {
  render() {
    return (
      <td className='actions'>
        <p onClick={this.props.clickAction}>
          <span className='delete'>
            <i className='material-icons'>delete</i>
          </span>
        </p>
      </td>
    );
  }
}
