var app = angular.module('minmax', []);

app.controller("MinMaxCtrl", function ($scope) {
    $scope.formModel = {};

    $scope.onSubmit = function () {
        console.log("It works!");
        console.log($scope.formModel);
    };
});