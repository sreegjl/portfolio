---
tags:
  - nand2tetris
date: 12/28/2025
---

# The HACK CPU

<font size=2>These are my notes from the Nand2Tetris course, covering hardware construction, computer architecture, virtual machines, and low-level software built from first principles. My project files from this course can be found on <a href="https://github.com/sreegjl/nand2tetris" target="_blank">GitHub</a>.</font>

The Hack CPU is a 16-bit processor designed to execute the current instruction and figure out which instruction to execute next. The CPU is connected to both the ROM and the RAM.

The HACK CPU has three inputs:
- `inM`; 16-bit Data Values (from Data Memory)
- `instruction`; 16-bit Instructions (from Instruction Memory)
- `reset`; Reset Bit (from the user)

The HACK CPU has four outputs:
- `outM`; 16-bit Data Values (to Data Memory)
- `writeM`; Write to memory? (yes / no) (to Data Memory)
- `addressM`; 15-bit Memory Address (to Data Memory)
- `pc`; 15-bit Address of next instruction (to Instruction Memory)

<img src="files/images/HackCPUInterface.png" alt="Hack CPU Interface">

**Hack CPU Operation**

Given Hack Machine Language instructions like `D = D-A`; `@17`; `M = M+1`, the CPU executes the instruction according to the Hack language specification. 
- If the instruction includes D and A, the respective values are read from, and/or written to, the CPU-resident D-register and A-register. 
- If the instruction is @x, then x is stored in the A-register; this value is emitted by `addressM`. 
- If the instruction's RHS includes M, this value is read from `inM`. 
- If the instruction's LHS includes M, then the ALU output is emitted by `outM`, and the `writeM` bit is asserted.

Given jump instructions like `@100`; `D = D-1; JEQ`:
- If `(reset==0)`: The CPU logic uses the instruction's jump bits and the ALU's output to decide if there should be a jump. If there is a jump, PC is set to the value of the A-register, else, PC++, and the updated PC value is emitted by `pc`.
- If `(reset==1)`: PC is set to 0, `pc` emits 0 (causing a program restart).

In the following implementation of the HACK CPU, the symbol `c` represents control bits. 

<img src="files/images/HackCPUImplementation.png" alt="Hack CPU Implementation">

**Instruction Handling**

When handling an A-instruction that is passed into the Mux16, the CPU decodes the instruction into an op-code and a 15-bit value. If the op-code is 0, the instruction is identified as an A-instruction, and the 15-bit value is loaded into the A-register. The value stored in the A-register is then made available to the rest of the CPU for use in subsequent steps.

When handling a C-instruction that is passed into the Mux16, the CPU decodes the instruction bits into an op-code, ALU control bits, destination load bits, and jump bits. If the op-code is 1, the instruction is identified as a C-instruction, and the decoded control signals determine how the ALU operates, which registers (including A, D, or memory) receive the ALU output, and whether a jump should be taken.

The A register can be loaded in two cases: directly from an A-instruction, or from the ALU output when a C-instruction specifies A as a destination; the control logic ensures the correct source is selected and that these conditions are combined when generating the A register’s load signal.

<img src="files/images/HackInstructionHandling.png" alt="Hack Instruction Handling">

**ALU Operation**

The data inputs of the [[Arithmetic Logic Unit (ALU)]] come from the D-register and either the value from the A-register or the M-register. The ALU also has six control bits, taken from the instruction, which specify which operation to carry out.

The ALU output is made available to the D-register, the A-register, and externally to the M-register interface. Which register actually receives the value is determined by the instruction’s destination bits. The ALU also has two control outputs, which indicate whether the result is zero or negative.

<img src="files/images/HackALUOperation.png" alt="Hack ALU Operation">

**Control**

The computer is already loaded with a program; when the reset bit is asserted, execution is forced to restart from the beginning of the program.

The Program Counter (PC) emits the address of the next instruction to be fetched. To start or restart execution, the PC is set to 0. If the jump bits specify no jump, the PC increments to the next instruction. If the jump bits specify an unconditional jump, the PC is set to the value stored in the A register. If the jump bits specify a conditional jump, the PC is set to A only if the specified condition based on the ALU output is satisfied; otherwise, the PC increments.

```
// PC Logic (Pseudocode)

if(reset==1)PC=0
else
	// current instruction
	load=f (jump bits, ALU control outputs)
	if(load==1)PC=A
	else   PC++
```

<img src="files/images/HackControl.png" alt="Hack Control">