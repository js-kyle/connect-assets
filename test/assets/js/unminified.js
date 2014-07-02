(function () {
  var aVeryLongVariableName = "A string";

  var someFunctions = {
    aLongKeyName: function () {
      return aVeryLongVariableName;
    }
  };
  var x = someFunctions.aLongKeyName();
})();
