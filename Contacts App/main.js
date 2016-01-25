var app = angular.module("codecraft", [
    "ngResource", "infinite-scroll"
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
    };

    $scope.sensitiveSearch = function(person) {
        if ($scope.search) {
            return person.name.indexOf($scope.search) == 0 || person.email.indexOf($scope.search) == 0;
        }
        return true;
    }

});

app.service('ContactService', function (Contact) {

    var self = {
        "addPerson": function(person){
            this.persons.push(person);
        },
        "page": 1,
        "hasMore": true,
        "isLoading": false,
        "selectedPerson" :  null,
        "selectedIndex" : null,
        "persons" : [],
        "loadContacts": function() {
            Contact.get(function(data){
                console.log(data);
                angular.forEach(data.results, function(person){
                        self.persons.push(new Contact(person));
                    })
            });
        }
    };

    self.loadContacts();
    return self;

});