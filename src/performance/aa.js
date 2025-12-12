function isCycleDep(obj) {
    const map = new WeakMap(); // 用于存储访问过的对象
    
    function check(value) {
      if (value && typeof value === 'object') {
        if (map.has(value)) {
          return true; 
        }
        map.set(value, true); 
        
        for (const key in value) {
          if (check(value[key])) {
            return true;
          }
        }
      }
      return false; 
    }
  
    return check(obj);
  }
  

let a = {}
let b = {}
let c = {}
let d = {}
d.child = 1
a.child = b;
b.child = c;
c.child = a
console.log(11111);

console.log(isCycleDep(a));
  // true
console.log(isCycleDep(d));
  // false