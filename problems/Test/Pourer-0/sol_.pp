{$mode objfpc}{$h+}{$r+}
var
  s: string;
begin
  AssignFile(input, 'input.txt'); Reset(input);
  AssignFile(output, 'output.txt'); Rewrite(output);
  Readln(s);
  Writeln(s);
end.
