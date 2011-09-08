//= require_tree nested
//= require_tree .

// That first require_tree is redundant, but it tests for a bug
// where cyclic dependencies were being erroneously reported.