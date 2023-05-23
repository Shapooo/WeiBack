function LRUCache(capacity) {
    this.capacity = capacity;
    this.next = new Uint16Array(capacity);
    this.prev = new Uint16Array(capacity);
    this.K = new Array(capacity);
    this.V = new Array(capacity);

    this.size = 0;
    this.head = 0;
    this.tail = 0;
    this.items = new Map();
}

LRUCache.prototype.splayOnTop = function (pointer) {
    var oldHead = this.head;

    if (this.head === pointer)
        return this;

    var previous = this.prev[pointer],
        next = this.next[pointer];

    if (this.tail === pointer) {
        this.tail = previous;
    }
    else {
        this.prev[next] = previous;
    }

    this.next[previous] = next;

    this.prev[oldHead] = pointer;
    this.head = pointer;
    this.next[pointer] = oldHead;

    return this;
};

LRUCache.prototype.set = function (key, value) {

    var pointer = this.items.get(key);

    if (typeof pointer !== 'undefined') {
        this.splayOnTop(pointer);
        this.V[pointer] = value;

        return;
    }

    if (this.size < this.capacity) {
        pointer = this.size++;
    }

    else {
        pointer = this.tail;
        this.tail = this.prev[pointer];
        this.items.delete(this.K[pointer]);
    }

    this.items.set(key, pointer);
    this.K[pointer] = key;
    this.V[pointer] = value;

    this.next[pointer] = this.head;
    this.prev[this.head] = pointer;
    this.head = pointer;
};

LRUCache.prototype.get = function (key) {
    var pointer = this.items.get(key);

    if (typeof pointer === 'undefined')
        return;

    this.splayOnTop(pointer);

    return this.V[pointer];
};
