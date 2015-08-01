#= require other.js

window.Foo = class Foo
   constructor: (args) ->
      this.args = args
      throw Error("Look this maps to CoffeeScript!")

foo = new window.Foo();
