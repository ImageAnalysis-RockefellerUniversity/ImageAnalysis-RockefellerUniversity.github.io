
factor = 5;

run("Bin...", "x=&factor y=&factor bin=Max");

run("Scale...", "x=&factor y=&factor interpolation=None create");
