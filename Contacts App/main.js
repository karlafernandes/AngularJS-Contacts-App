var app = angular.module("codecraft", [
    "ngResource", "infinite-scroll", "angularSpinner"
]);

app.config(function($httpProvider, $resourceProvider){
    $httpProvider.defaults.headers.common["Authorization"] = "Token edcfde75310244326fe1689e369f2e609fb7e4c4";
    $resourceProvider.defaults.stripTrailingSlashes = false;
});

app.factory("Contact", function($resource){
    return $resource("https://codecraftpro.com/api/samples/v1/contact/:id/");
});

app.controller('PersonDetailController', function ($scope, ContactService) {
    $scope.contacts = ContactService;
});

app.controller('PersonListController', function ($scope, ContactService) {

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

});

app.service('ContactService', function (Contact) {

    var self = {
        "page": 1,
        "hasMore": true,
        "isLoading": false,
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
        }
    };

    self.loadContacts();
    return self;

});