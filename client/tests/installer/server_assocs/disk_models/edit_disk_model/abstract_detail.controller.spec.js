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

    describe('AbstractDetailController', function() {
        var $controller;

        beforeEach(module('dayzero.installer'));

        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should collapse row on cancel', function() {
            var controller = $controller('AbstractDetailController', {});
            controller.attributes = ['name'];

            var row = {name: 'original', _name: 'new'};
            controller.cancel(row);

            expect(row._expanded).toBeFalsy();
            expect(row.name).toBe('original');
        });

        it('should collapse row on save and save fields', function() {
            var controller = $controller('AbstractDetailController', {});
            controller.attributes = ['name', 'id'];

            var row = {name: 'original', _name: 'new', id: 'old', _id: 'updated'};
            controller.save(row);

            expect(row.name).toEqual('new');
            expect(row.id).toEqual('updated');
        });
    })
})();
