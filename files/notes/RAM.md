---
tags:
  - nand2tetris
---

# Random Access Memory (RAM)

### AND-OR Latch
If we take an OR gate and feed its output back into one of its inputs (input B), the output will be 0 as long as input A is 0. When input A is set to 1, the output becomes 1. If input A is then set back to 0, the output remains 1 because input B is still 1. This feedback allows the circuit to store a 1.  

Performing the same experiment with an AND gate, starting with both inputs set to 1, the output is initially 1. When input A is switched to 0, the output (and thus input B) becomes 0. From that point on, the output remains 0 regardless of how input A changes. This feedback allows the circuit to store a 0.

By combining these circuits, we can create an AND–OR latch, where a set input drives the output to 1 and a reset input drives it to 0. If set and reset are both 0, the circuit will output whatever was last stored. 

### Gated Latch (D-Latch)
By adding additional logic gates to the AND–OR latch, we can create a gated latch circuit with a data input and a write enable input. When write enable is active, the value on the data input is written into the latch. When write enable is inactive, the latch ignores changes to the data input and retains its previously stored value.

### D Flip-Flop (DFF)
A D flip-flop is often used instead of a D latch because it updates its output only on a clock edge, preventing unintended changes during the clock level and making synchronous systems predictable and stable. A D flip-flop is built by connecting two D latches in series with opposite clock enables, so the output updates only on a clock edge. 

The first latch (the master) samples and holds the input while the clock is high, while the second latch (the slave) is closed. When the clock transitions, the master latch closes and the slave latch opens, copying the stored value to the output. Because the two latches are never transparent at the same time, changes to the input cannot propagate directly to the output, causing the output to update only at the clock edge.

### Registers & Memory
The gated latch can only store one-bit values. By grouping multiple latches side by side, we can store multi-bit values. For example, grouping eight latches allows us to store an 8-bit value. A group of latches operating together in this way is called a register, which holds a single number, and the number of bits in a register is called its width.

As the amount of data we want to store grows, it becomes impractical to treat memory as one long line of latches. Organizing latches into rows and columns allows memory to scale efficiently, since addresses can be split into smaller parts and decoded separately.

To access a specific latch within a larger memory array, we use addresses. In a memory array with 16 rows, the row address can be represented using a 4-bit number. The same applies to the column address. By using two multiplexers, one to select the row and one to select the column, we can route the correct latch’s output and control signals, allowing us to read from or write to a specific location in memory.

When abstracted, this 256-bit memory (16 × 16) has an 8-bit address input, a single data input, a write enable input, and a read enable input.

### Random Access Memory (RAM)
To scale up further, we can arrange multiple 256-bit memories side by side. For example, by placing eight 256-bit memories in parallel and feeding the same 8-bit address into all of them, each memory stores one bit of an 8-bit value at that address. Together, they form a memory that stores 256 separate 8-bit values.

In this arrangement, the address selects which value is accessed, while all eight memories are read from or written to simultaneously, allowing a full byte to be stored or retrieved at once.

Because any memory address can be accessed at any time and in any order, this is called random access memory, or RAM.

### Data Memory
In the Hack computer, there are three main segments in the data memory.
- Random Access Memory 
	- 16-bit / 16K RAM chip
	- Addresses 0 to 16383
- Screen Memory Map
	- 16-bit / 8K memory chip with a raster display side-effect
	- Addresses 16384 to 24575
- Keyboard Register
	- 16-bit register with a keyboard capture side-effect
	- Address 24576
