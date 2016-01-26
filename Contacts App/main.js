var app = angular.module("codecraft", [
    "ngResource",
    "infinite-scroll",
    "angularSpinner",
    "jcs-autoValidate",
    "angular-ladda",
    "mgcrea.ngStrap",
    "toaster",
    "ngAnimate",
    "ui.router"
]);

// #/ - List Of Contacts + Search + Filtering
// #/create - Create a contact
// #/edit/:id - Edit a contact

app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state("list", {
            url: "/",
            views: {
                "main": {
                    templateUrl: "templates/list.html",
                    controller: "PersonListController",
                },
                "search": {
                    templateUrl: "templates/searchform.html",
                    controller: "PersonListController",
                }
            }
        })
        .state("edit", {
            url: "/edit/:email", // $stateParams email
            views: {
                "main": {
                    templateUrl: "templates/edit.html",
                    controller: "PersonDetailController",
                }
            }
        })
        .state("create", {
            url: "/create",
            views: {
                "main": {
                    templateUrl: "templates/edit.html",
                    controller: "PersonCreateController",
                },
            }
        });
    $urlRouterProvider.otherwise("/");
});

app.config(function ($httpProvider, $resourceProvider, laddaProvider, $datepickerProvider) {
    $httpProvider.defaults.headers.common["Authorization"] = "Token edcfde75310244326fe1689e369f2e609fb7e4c4";
    $resourceProvider.defaults.stripTrailingSlashes = false;
    laddaProvider.setOption({
        style: "expand-right"
    });
    angular.extend($datepickerProvider.defaults, {
        dateFormat: "d/M/yyyy",
        autoclose: true
    });
});

app.factory("Contact", function ($resource) {
    return $resource("https://codecraftpro.com/api/samples/v1/contact/:id/", {id: "@id"}, {
        update: {
            method: "PUT"
        }
    });
});

app.filter("defaultImage", function () {

    return function (input, param) {
        if (!input) {
            return param;
        }
        return input;
    };

});

app.directive("ccSpinner", function () {
    return {
        "transclude": true,
        "restrict": "E", // Attribute Element Class AEC
        "templateUrl": "templates/spinner.html",
        "scope": {
            "isLoading": "=",
            "message": "@"
        }
    }
});

app.controller("PersonCreateController", function ($scope, $state, ContactService) {

    $scope.mode = "Create";
    $scope.contacts = ContactService;
    $scope.contacts.selectedPerson = null;

    $scope.cancel = function () {
        $state.go("list");
    };

    $scope.save = function () {
        console.log("Creating Contact");
        $scope.contacts.createContact($scope.contacts.selectedPerson).then(function () {
            $state.go("list");
        })
    };
});

app.controller("PersonDetailController", function ($scope, $stateParams, $state, ContactService) {

    $scope.mode = "Edit";
    $scope.contacts = ContactService;
    $scope.contacts.selectedPerson = $scope.contacts.getPerson($stateParams.email);

    $scope.save = function () {
        $scope.contacts.updateContact($scope.contacts.selectedPerson).then(function () {
            $state.go("list");
        });
    };

    $scope.remove = function () {
        $scope.contacts.removeContact($scope.contacts.selectedPerson).then(function () {
            $state.go("list");
        });
    }
});

app.controller("PersonListController", function ($scope, $modal, ContactService) {

    $scope.search = "";
    $scope.order = "email";
    $scope.contacts = ContactService;

    $scope.loadMore = function () {
        console.log("Load More!");
        $scope.contacts.loadMore();
    };

    $scope.showCreateModal = function () {
        $scope.contacts.selectedPerson = {};
        $scope.createModal = $modal({
            scope: $scope,
            template: "templates/modal.create.tpl.html",
            show: true
        })
    };

});

// $q create promisses which you can return from functions
app.service("ContactService", function (Contact, $rootScope, $q, toaster) {

    var self = {
        "page": 1,
        "hasMore": true,
        "isLoading": false,
        "isSaving": false,
        "selectedPerson": null,
        "persons": [],
        "search": null,
        "ordering": "name",
        "loadContacts": function () {
            if (self.hasMore && !self.isLoading) {
                self.isLoading = true;

                var params = {
                    "page": self.page,
                    "search": self.search,
                    "ordering": self.ordering
                };

                Contact.get(params, function (data) {
                    console.log(data);
                    angular.forEach(data.results, function (person) {
                        self.persons.push(new Contact(person));
                    });
                    if (!data.next) {
                        self.hasMore = false;
                    }
                    self.isLoading = false;
                });
            }
        },
        "loadMore": function () {
            if (self.hasMore && !self.isLoading) {
                self.page++;
                self.loadContacts();
            }
        },
        "getPerson": function (email) {
            console.log(email);
            for (var i = 0; i < self.persons.length; i++) {
                var obj = self.persons[i];
                if (obj.email == email) {
                    return obj;
                }
            }
        },
        "doSearch": function () {
            self.hasMore = true;
            self.page = 1;
            self.persons = [];
            self.loadContacts();
        },
        "doOrder": function () {
            self.hasMore = true;
            self.page = 1;
            self.persons = [];
            self.loadContacts();
        },
        "updateContact": function (person) {
            console.log("Service Called Update");

            var d = $q.defer();
            self.isSaving = true;
            Contact.update(person).$promise.then(function () {
                self.isSaving = false;
                toaster.pop("success", "Updated " + person.name);
                d.resolve();
            });
            return d.promise;
        },
        "removeContact": function (person) {
            console.log("Service Called Remove");

            var d = $q.defer();
            self.isDeleting = true;
            Contact.remove(person).$promise.then(function () {
                self.isDeleting = false;
                var index = self.persons.indexOf(person);
                self.persons.splice(index, 1);
                self.selectedPerson = null;
                toaster.pop("success", "Deleted " + person.name);
                d.resolve();
            });
            return d.promise;
        },
        "createContact": function (person) {
            console.log("Service Called Create");

            var d = $q.defer();
            self.isSaving = true;
            Contact.save(person).$promise.then(function () {
                self.isSaving = false;
                self.selectedPerson = null;
                self.hasMore = true;
                self.page = 1;
                self.persons = [];
                self.loadContacts();
                toaster.pop("success", "Created " + person.name);
                d.resolve();
            });
            return d.promise;
        },
        "watchFilters": function () {
            $rootScope.$watch(function () {
                return self.search;
            }, function (newVal) {
                if (angular.isDefined(newVal)) {
                    self.doSearch();
                }
            });
            $rootScope.$watch(function () {
                return self.ordering;
            }, function (newVal) {
                if (angular.isDefined(newVal)) {
                    self.doOrder();
                }
            });
        }
    };

    self.loadContacts();
    self.watchFilters();
    return self;

});