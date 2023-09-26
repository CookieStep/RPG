var keys = new (class Keys extends Map {
    use(code) {
        return this.get(code) == 1 && this.set(code, 2);
    }
    multi(code) {
        return this.get(code) & 1 && this.set(code, 2);
    }
});

onkeydown = ({code}) => keys.has(code) || keys.set(code, 1);
onkeyup = ({code})   => keys.delete(code);