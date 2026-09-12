(function(){
  class ByteEngine {
    constructor(callbacks = {}) {
      this.cb = callbacks;
      this.maxSteps = 500;
      this.resetState([], 0, []);
    }

    snapshot(extra = {}) {
      return {
        input: [...this.input], output: [...this.output], memory: [...this.memory], held: this.held,
        pc: this.pc, steps: this.steps, halted: this.halted, error: this.error, ...extra
      };
    }

    resetState(input, memorySlots, program) {
      this.input = [...input];
      this.originalInput = [...input];
      this.output = [];
      this.memory = Array.from({length: memorySlots}, () => null);
      this.program = program.map(x => ({...x}));
      this.held = null;
      this.pc = 0;
      this.steps = 0;
      this.halted = false;
      this.error = null;
      this.finishedNaturally = false;
      this.emit();
    }

    setProgram(program) { this.program = program.map(x => ({...x})); }
    emit(extra = {}) { if (this.cb.onState) this.cb.onState(this.snapshot(extra)); }

    fail(message, before, meta = {}) {
      this.halted = true;
      this.error = message;
      const after = this.snapshot({event:"error", message, ...meta});
      this.emit({event:"error", message, ...meta});
      return {status:"error", message, before: before || this.snapshot(), after, ...meta};
    }

    step() {
      const before = this.snapshot();
      if (this.halted) return {status:this.error ? "error" : "halted", before, after:this.snapshot()};
      if (this.steps >= this.maxSteps) return this.fail("Safety stop: your program ran for 500 steps. Possible infinite loop.", before);
      if (this.pc < 0 || this.pc >= this.program.length) {
        this.halted = true;
        this.finishedNaturally = true;
        const after = this.snapshot({event:"halt"});
        this.emit({event:"halt"});
        return {status:"halted", event:"halt", before, after};
      }

      const line = {...this.program[this.pc]};
      const currentPc = this.pc;
      this.steps++;
      let event = "execute";

      switch(line.op) {
        case "READ":
          if (!this.input.length) {
            this.steps--;
            this.halted = true;
            this.finishedNaturally = true;
            const after = this.snapshot({event:"inbox-empty", executedPc:currentPc, instruction:line});
            this.emit({event:"inbox-empty", executedPc:currentPc, instruction:line});
            return {status:"halted", reason:"inbox-empty", event:"inbox-empty", before, after, executedPc:currentPc, instruction:line};
          }
          this.held = this.input.shift(); this.pc++; event = "read"; break;
        case "WRITE":
          if (this.held === null) return this.fail("OUTBOX needs a value, but your hands are empty.", before, {executedPc:currentPc,instruction:line});
          this.output.push(this.held); this.held = null; this.pc++; event = "write"; break;
        case "STORE":
          if (this.held === null) return this.fail("COPYTO needs a value in your hands.", before, {executedPc:currentPc,instruction:line});
          if (!this.validMem(line.arg)) return this.fail("That memory tile does not exist.", before, {executedPc:currentPc,instruction:line});
          this.memory[line.arg] = this.held; this.pc++; event = "store"; break;
        case "PLACE":
          if (this.held === null) return this.fail("PLACE needs a value in your hands.", before, {executedPc:currentPc,instruction:line});
          if (!this.validMem(line.arg)) return this.fail("That memory tile does not exist.", before, {executedPc:currentPc,instruction:line});
          this.memory[line.arg] = this.held; this.held = null; this.pc++; event = "place"; break;
        case "TAKE":
          if (!this.validMem(line.arg) || this.memory[line.arg] === null) return this.fail("TAKE tried to pick up an empty floor slot.", before, {executedPc:currentPc,instruction:line});
          this.held = this.memory[line.arg]; this.memory[line.arg] = null; this.pc++; event = "take"; break;
        case "LOAD":
          if (!this.validMem(line.arg) || this.memory[line.arg] === null) return this.fail("COPYFROM tried to read an empty memory tile.", before, {executedPc:currentPc,instruction:line});
          this.held = this.memory[line.arg]; this.pc++; event = "load"; break;
        case "ADD":
          if (this.held === null) return this.fail("ADD needs a value in your hands.", before, {executedPc:currentPc,instruction:line});
          if (!this.validMem(line.arg) || this.memory[line.arg] === null) return this.fail("ADD tried to use an empty memory tile.", before, {executedPc:currentPc,instruction:line});
          this.held += this.memory[line.arg]; this.pc++; event = "math"; break;
        case "SUB":
          if (this.held === null) return this.fail("SUB needs a value in your hands.", before, {executedPc:currentPc,instruction:line});
          if (!this.validMem(line.arg) || this.memory[line.arg] === null) return this.fail("SUB tried to use an empty memory tile.", before, {executedPc:currentPc,instruction:line});
          this.held -= this.memory[line.arg]; this.pc++; event = "math"; break;
        case "JUMP":
          if (!this.validLine(line.arg)) return this.fail("JUMP points outside your program.", before, {executedPc:currentPc,instruction:line});
          this.pc = line.arg; event = "jump"; break;
        case "JNEG":
          if (this.held === null) return this.fail("JUMP- needs a value in your hands.", before, {executedPc:currentPc,instruction:line});
          if (!this.validLine(line.arg)) return this.fail("JUMP- points outside your program.", before, {executedPc:currentPc,instruction:line});
          this.pc = this.held < 0 ? line.arg : this.pc + 1; event = "jump"; break;
        case "JZERO":
          if (this.held === null) return this.fail("JUMP0 needs a value in your hands.", before, {executedPc:currentPc,instruction:line});
          if (!this.validLine(line.arg)) return this.fail("JUMP0 points outside your program.", before, {executedPc:currentPc,instruction:line});
          this.pc = this.held === 0 ? line.arg : this.pc + 1; event = "jump"; break;
        default: return this.fail("Unknown instruction: " + line.op, before, {executedPc:currentPc,instruction:line});
      }

      const after = this.snapshot({event, executedPc:currentPc, instruction:line});
      this.emit({event, executedPc:currentPc, instruction:line});
      return {status:"ok", event, before, after, executedPc:currentPc, instruction:line};
    }

    validMem(i){ return Number.isInteger(i) && i >= 0 && i < this.memory.length; }
    validLine(i){ return Number.isInteger(i) && i >= 0 && i < this.program.length; }
  }
  window.ByteEngine = ByteEngine;
})();
