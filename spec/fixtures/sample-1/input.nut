@include "inc-a.nut"

@set SOMEVAR1 123
@set SOMEVAR2 256

@if SOMEVAR1 == 123
  // should not be included
@elseif SOMEVAR2 == 0
  // should not be included
@elseif SOMEVAR2 == 256
  // should be included
@endif

@if SOMEVAR2
  // should be included
@endif