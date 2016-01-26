var app = angular.module("codecraft", [
    "ngResource",
    "infinite-scroll",
    "angularSpinner",
    "jcs-autoValidate",
    "angular-ladda",
    "mgcrea.ngStrap",
    "toaster",
    "ngAnimate"
]);

app.config(function($httpProvider, $resourceProvider, laddaProvider, $datepickerProvider){
    $httpProvider.defaults.headers.common["Authorization"] = "Token edcfde75310244326fe1689e369f2e609fb7e4c4";
    $resourceProvider.defaults.stripTrailingSlashes = false;
    laddaProvider.setOption({
        style: "expand-right"
    });
    angular.extend($datepickerProvider.defaults, {
        dateFormat: 'd/M/yyyy',
        autoclose: true
    });
});

app.factory("Contact", function($resource){
    return $resource("https://codecraftpro.com/api/samples/v1/contact/:id/",
                    {id:"@id"},
                    {update:{ method: "PUT"}}
    );
});

app.filter("defaultImage", function(){

    return function(input, param){
        console.log(input + " " + param)
        if (!input){
            return param;
        } else {
            return input;
        }
    };

});

app.controller('PersonDetailController', function ($scope, ContactService) {
    $scope.contacts = ContactService;

    $scope.save = function(){
        $scope.contacts.updateContact($scope.contacts.selectedPerson);
    }

    $scope.remove = function(){
        $scope.contacts.removeContact($scope.contacts.selectedPerson);
    }
});

app.controller('PersonListController', function ($scope, $modal, ContactService) {

    $scope.search = "";
    $scope.order = "email";
    $scope.contacts = ContactService;

    $scope.loadMore = function(){
        console.log("Load More!");
        $scope.contacts.loadMore();
    };

    $scope.$watch("search", function(newVal, oldVal){
        console.log("search "+ newVal + " " + oldVal);
        if (angular.isDefined(newVal)){
            $scope.contacts.doSearch(newVal);
        }
    });

    $scope.$watch("order", function(newVal, oldVal){
        console.log("order "+ newVal + " " + oldVal);
        if (angular.isDefined(newVal)){
            $scope.contacts.doOrder(newVal);
        }
    });

    $scope.showCreateModal = function(){
        $scope.contacts.selectedPerson = {};
        $scope.createModal = $modal({
            scope: $scope,
            template: "templates/modal.create.tlp.html",
            show: true
        })
    };

    $scope.createContact = function(){
        console.log("Creating Contact");
        $scope.contacts.createContact($scope.contacts.selectedPerson)
            .then(function(){
                $scope.createModal.hide();
            });
    };
});

// $q create promisses which you can return from functions
app.service('ContactService', function (Contact, $q, toaster) {

    var self = {
        "page": 1,
        "hasMore": true,
        "isLoading": false,
        "isSaving": false,
        "isDeleting": false,
        "selectedPerson": null,
        "selectedIndex": null,
        "persons": [],
        "search": null,
        "ordering":null,
        "addPerson": function(person){
            this.persons.push(person);
        },
        "loadContacts": function() {
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
                    })
                    if (!data.next) {
                        self.hasMore = false;
                    }
                    self.isLoading = false;
                });
            }
        },
        "loadMore": function() {
            if(self.hasMore && !self.isLoading){
                self.page++;
                self.loadContacts();
            }
        },
        "doSearch": function(search){
            self.hasMore = true;
            self.page = 1;
            self.persons = [];
            self.search = search;
            self.loadContacts();
        },
        "doOrder": function(order){
            self.hasMore = true;
            self.page = 1;
            self.persons = [];
            self.ordering = order;
            self.loadContacts();
        },
        "updateContact": function(person) {
            console.log("Service Called Update");
            self.isSaving = true;
            //Contact.update(person); simply update person
            //Contact.update(person).$promise.then(function(){
            person.$update().then(function(){
                self.isSaving = false;
                toaster.pop("success", "Updated "+ person.name);
            });
        },
        "removeContact": function(person){
            console.log("Service Called Remove");
            self.isDeleting = true;
            person.$remove().then(function(){
                self.isDeleting = false;
                var index = self.persons.indexOf(person);
                self.persons.splice(index, 1);
                self.selectedPerson = null;
                toaster.pop("success", "Deleted "+ person.name);
            });
        },
        "createContact": function(person){
            console.log("Service Called Create");

            var d = $q.defer();
            self.isSaving = true;
            Contact.save(person).$promise.then(function(){
                self.isSaving = false;
                self.persons.push(person);
                //self.selectedPerson = null;
                //self.hasMore = true;
                //self.page = 1;
                //self.persons = [];
                toaster.pop("success", "Created "+ person.name);
                d.resolve();
            });
            return d.promise;
        },
    };

    self.loadContacts();
    return self;

});