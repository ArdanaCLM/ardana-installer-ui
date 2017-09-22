/**
 * (c) Copyright 2015-2017 Hewlett Packard Enterprise Development LP
 * (c) Copyright 2017 SUSE LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
(function() {
    'use strict';

    angular
        .module('dayzero')
        .directive('actionCol', actionCol);

    actionCol.$inject = ['app.basePath'];

    function actionCol(path) {
        var directive = {
            link: link,
            restrict: 'A',
            templateUrl: path + 'core/widgets/action-table/action-col.html',
            transclude: true
        };
        return directive;

        //////////

        function link(scope, element, attrs, ctrl, transclude) {
            var dropdownMenu = element.find('ul');

            transclude(scope, function(clone) {
                dropdownMenu.append(clone);
            });
        }
    }

})();
