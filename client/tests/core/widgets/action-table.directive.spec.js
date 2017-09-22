(function() {
    'use strict';

    describe('action-table Directive', function() {
        var $compile, $scope, $element, DrawerService, modalInstance;

        beforeEach(module('templates'));
        beforeEach(module('dayzero', function($provide, $translateProvider) {
            $provide.factory('customLoader', function($q) {
                return function() {
                    var deferred = $q.defer();
                    deferred.resolve({});
                    return deferred.promise;
                };
            });

            $translateProvider.useLoader('customLoader');
        }));

        beforeEach(inject(function($injector) {
            $compile = $injector.get('$compile');
            $scope = $injector.get('$rootScope').$new();
            var $modal = $injector.get('$modal');
            DrawerService = $injector.get('DrawerService');

            modalInstance = {
                result: {
                    then: function(confirmCallback) {
                        this.confirmCallback = confirmCallback;
                    }
                },
                close: function() {
                    this.result.confirmCallback();
                }
            };

            spyOn($modal, 'open').and.returnValue(modalInstance);

            $scope.testData = [];
            $scope.headers = [
                {label: 'Animal', key: 'animal'},
                {label: 'Name', key: 'name'}
            ];
            $scope.detailTemplate = 'tests/core/widgets/templates/detail.html';
        }));

        it('should render table', function() {
            var markup = '<action-table table-data="testData" table-headers="headers">'
            '</action-table>';
            $element = $compile(angular.element(markup))($scope);

            $scope.$apply();

            expect($element.find('table.table-as-header').length).toBe(1);
            expect($element.find('table.table-as-content').length).toBe(1);
        });

        it('should render table with custom add button label', function() {
            $scope.config = {
                btn: {add: 'Add Me'}
            };
            var markup = '<action-table table-data="testData" table-headers="headers" ' +
                '  config="config">' +
                '</action-table>';
            $element = $compile(angular.element(markup))($scope);

            $scope.$apply();

            expect($element.isolateScope().btnLabels.add).toBe('Add Me');
        });

        it('should render table with custom drawer title', function() {
            $scope.config = {
                drawer: {addTitle: 'Add Me'}
            };
            var markup = '<action-table table-data="testData" table-headers="headers" ' +
                '  config="config">' +
                '</action-table>';
            $element = $compile(angular.element(markup))($scope);

            $scope.$apply();

            expect($element.isolateScope().drawerCfg.addTitle).toBe('Add Me');
        });

        it('should render table with detail template', function() {
            $scope.testData = [
                {animal: 'cat', name: 'Boomer'},
                {animal: 'dog', name: 'Fido'}
            ];
            var markup = '<action-table table-data="testData" table-headers="headers" ' +
                '  detail-template="detailTemplate">'
            '</action-table>';
            $element = $compile(angular.element(markup))($scope);

            $scope.$apply();

            var directiveScope = $element.isolateScope();
            expect($element.find('tbody tr').length).toBe(4);
            expect($element.find('tbody .detail-row').length).toBe(2);
        });

        it('should expand detail row if expand icon is visible and detail template provided', function() {
            $scope.testData = [
                {animal: 'cat', name: 'Boomer'},
                {animal: 'dog', name: 'Fido'}
            ];
            var markup = '<action-table table-data="testData" table-headers="headers" ' +
                '  show-expand-icon detail-template="detailTemplate">'
            '</action-table>';
            $element = $compile(angular.element(markup))($scope);

            $scope.$apply();

            $element.find('.expander').first().click();
            expect($element.find('.detail-row').first().hasClass('expanded')).toBe(true);

            $element.find('.expander').first().click();
            expect($element.find('.detail-row').first().hasClass('expanded')).toBe(false);
        });

        it('should render table with checkboxes if selectable', function() {
            $scope.testData = [
                {animal: 'cat', name: 'Boomer'},
                {animal: 'dog', name: 'Fido'}
            ];
            var markup = '<action-table table-data="testData" table-headers="headers" ' +
                '  selectable>'
            '</action-table>';
            $element = $compile(angular.element(markup))($scope);

            $scope.$apply();

            expect($element.find('input[type="checkbox"]').length).toBe(2);
            expect($element.isolateScope().colSpan).toBe(4);
        });

        describe('rendering actions on the action table', function() {
            beforeEach(function() {
                $scope.testData = [
                    {animal: 'cat', name: 'Boomer'},
                    {animal: 'dog', name: 'Fido'}
                ];
            });

            it('should render table with add/edit/delete actions by default', function() {
                var markup = '<action-table table-data="testData" table-headers="headers"></action-table>';
                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();

                var directiveScope = $element.isolateScope();
                expect($element.find('td[action-col]').length).toBe(2);
                expect($element.find('th button').length).toBe(1);
                expect(directiveScope.colSpan).toBe(3);
            });

            it('should render table without add/edit/delete actions if no-crud', function() {
                var markup = '<action-table table-data="testData" table-headers="headers" ' +
                    '  no-crud="true">'
                '</action-table>';
                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();

                var directiveScope = $element.isolateScope();
                expect($element.find('td[action-col]').length).toBe(0);
                expect($element.find('th button').length).toBe(0);
                expect(directiveScope.colSpan).toBe(2);
            });

            it('should render table without add/edit/delete actions if no-crud toggles on/off', function() {
                $scope.noCrud = false;
                var markup = '<action-table table-data="testData" table-headers="headers" ' +
                    '  no-crud="noCrud">'
                '</action-table>';
                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();

                var directiveScope = $element.isolateScope();
                expect(directiveScope.actions.length).toBe(2);

                $scope.noCrud = true;
                $scope.$apply();
                expect(directiveScope.actions.length).toBe(0);

                $scope.noCrud = false;
                $scope.$apply();
                expect(directiveScope.actions.length).toBe(2);
            });
        });

        describe('action callbacks', function() {
            describe('when no override actions are given', function() {
                var isolateScope;
                beforeEach(function() {
                    var markup = '<action-table table-data="testData" table-headers="headers">' +
                        '</action-table>';
                    $element = $compile(angular.element(markup))($scope);

                    $scope.$digest();
                    isolateScope = $element.isolateScope();
                });

                it('should edit an item when editItem() called', function() {
                    isolateScope.tableData = [{animal: 'cat'}];
                    isolateScope.actions[0].callback(isolateScope.tableData[0]);
                    DrawerService.resolve({animal: 'dog'});

                    isolateScope.$digest();
                    expect(isolateScope.tableData.length).toBe(1);
                    expect(isolateScope.tableData[0].animal).toEqual('dog');
                });

                it('should delete an item when delete callback is called', function() {
                    isolateScope.tableData = [
                        {animal: 'cat'},
                        {animal: 'dog'},
                        {animal: 'fish'}
                    ];
                    isolateScope.actions[1].callback({animal: 'dog'});
                    modalInstance.close();

                    expect(isolateScope.tableData.length).toBe(2);
                    expect(isolateScope.tableData[0]).toEqual({animal: 'cat'});
                    expect(isolateScope.tableData[1]).toEqual({animal: 'fish'});
                });

                it('should add an item to tableData when addItem() called and resolved', function() {
                    isolateScope.tableData = [];
                    isolateScope.addAction();
                    DrawerService.resolve({animal: 'cat'});

                    $scope.$apply();

                    expect(isolateScope.tableData.length).toBe(1);
                });

                it('should add an item to tableData when addItem() called and notified', function() {
                    isolateScope.tableData = [];
                    isolateScope.addAction();
                    DrawerService.notify({animal: 'cat'});

                    $scope.$apply();

                    expect(isolateScope.tableData.length).toBe(1);
                });
            });

            describe('when override actions are given', function() {
                var editActionStub, deleteActionStub, addActionStub, isolateScope;

                beforeEach(function() {
                    editActionStub = jasmine.createSpy('editActionStub');
                    deleteActionStub = jasmine.createSpy('deleteActionStub');
                    addActionStub = jasmine.createSpy('addActionStub');
                    $scope.deleteActionStub = deleteActionStub;
                    $scope.editActionStub = editActionStub;
                    $scope.addActionStub = addActionStub;
                    var markup = '<action-table table-data="testData" ' +
                        'table-headers="headers" ' +
                        'edit-action="editActionStub" ' +
                        'delete-action="deleteActionStub" ' +
                        'add-action="addActionStub">' +
                        '</action-table>';
                    $element = $compile(angular.element(markup))($scope);
                    $scope.$digest();
                    isolateScope = $element.isolateScope();
                });

                it('should call the provided editAction', function() {
                    isolateScope.actions[0].callback();

                    expect(editActionStub).toHaveBeenCalled();
                });

                it('should call the provided deleteAction', function() {
                    isolateScope.actions[1].callback();

                    expect(deleteActionStub).toHaveBeenCalled();
                });

                it('should call the provided addAction', function() {
                    isolateScope.addAction();

                    expect(addActionStub).toHaveBeenCalled();
                });
            });
        });

        describe('custom actions', function() {
            it('should include custom actions in table', function() {
                $scope.testData = [
                    {animal: 'cat', name: 'Boomer'},
                    {animal: 'dog', name: 'Fido'},
                    {animal: 'fish', name: 'Nemo'}
                ];
                $scope.actions = [
                    {label: 'Foo', callback: angular.noop},
                    {label: 'Bar', callback: angular.noop}
                ];

                var markup = '<action-table table-data="testData" table-headers="headers" ' +
                    '  actions="actions">' +
                    '</action-table>';

                $element = $compile(angular.element(markup))($scope);

                $scope.$digest();

                expect($element.isolateScope().actions.length).toBe(4);
            });
        });
    });
})();
