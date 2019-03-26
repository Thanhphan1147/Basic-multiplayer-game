function Pool(maxCapacity) {
    var size = maxCapacity;
    var pool = [];
    this.init = function () {
      for (var i = 0; i < size; i++) {
          var arrow = new Arrow();
          arrow.init(0,0);
          pool[i] = arrow;
      }
    };
    this.get = function (x, y, angle) {
        if (!pool[size-1].alive) {
            pool[size-1].spawn(x, y, angle);
            //console.log('fire');
            pool.unshift(pool.pop());
        }
    };
    this.animate = function () {
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                if (pool[i].draw()) {
                    //console.log('exception reset');
                    pool[i].reset();
                    pool.push((pool.splice(i,1))[0]);
                }
            } else
                break;
        }
    };
}
