console.log(1);
function test1() {
  for(var i=0,l=100000000; i<l; i++) {
    var j=j*i;
  }
}

function test2(){
  console.log(2);
}

test1();
test2();
test3();
function test3(){
  for(var i=0,l=1000000000; i<l; i++){
    var j=j*i;
  }
  console.log(3);
}
test2();
test2();
