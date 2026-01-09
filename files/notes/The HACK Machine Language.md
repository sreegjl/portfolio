---
tags:
  - nand2tetris
date: 12/23/2025
---

# The HACK Machine Language

The HACK machine languages recognizes three registers:
- D register, data register; holds a 16-bit value
- A register, address / data register; holds a 16-bit value
- M register, currently selected memory register; the 16-bit RAM register addressed by A (i.e., `RAM[A]`)

The HACK machine language has two categories of instructions: 

<u>The A-instruction</u>
`@value`
- Sets the A register to `value`, and `RAM[A]` becomes the selected `RAM` register.
- `value` is either a non-negative decimal constant or a symbol referring to such a constant.

Example:
```
// Set `RAM[100]` to -1
@100 // A=100
M=-1 // RAM[100]=-1
```

<u>The C-instruction</u> 
`dest = comp ; jump` (both `dest` and `jump` are optional)
- `comp` = what to compute (an ALU operation)
- `dest` = where to store the computed value
- `jump` = what to do next

Examples:
```
// D=10
@10
D=A

// D++
D=D+1

// D=RAM[17]
@17
D=M

// RAM[17]=0
@17
M=0

// RAM[17]=10
@10
D=A
@17
M=D

// RAM[5] = RAM[3]
@3
D=M
@5
M=D
```

```
// Set RAM[300] to the value of the D register minus 1
@300 // A=100
M=D-1 // RAM[300]=D-1
```

```
// If (D-1==0) jump to execute the instruction stored in ROM[56]
@56 // A=56
D-1;JEQ // if (D-1 == 0) goto 56
```

To terminate a program safely, end it with an infinite loop:

```
// Computes: RAM[2] = RAM[0] + RAM[1]

@0
D=M // D= RAM[0]

@1
D=D+M // D = D + RAM[1]

@2
M=D // RAM[2] = D

@6
0;JMP
```

### HACK Machine Language: Built-In Symbols
The HACK assembly language features built-in symbols. 

**Virtual Registers**

These symbols (ranging from `R0, R1 ,..., R15`) can be used to denote "virtual registers".

So instead of:

```
// RAM[5]=15
@15
D=A

@5
M=D
```

We can write:

```
// RAM[5]=15
@15
D=A

@R5
M=D
```

This helps differentiate between when the A register is being used as a data register versus an address to a memory register.

**I/O Memory Maps**

`SCREEN` and `KBD` represent base addresses of I/O memory maps.

### HACK Machine Language: Branching

```
// if R0>0
//    R1=1
// else
//    R1=0

@R0
D=M   // D = RAM[0]

@8
D;JGT // If R0>0 goto 8

@R1   // RAM[1]=0
M=0   
@10
0;JMP // end of program

@R1
M=1   // R1=1

@10
0;JMP
```

Using symbolic references, we can create labels to make the code more readable:
```
@R0
D=M   

@POSITIVE // using a label
D;JGT 

@R1   
M=0   
@END
0;JMP 

(POSITIVE) // declaring a label
@R1
M=1   

(END)
@10
0;JMP
```

`@LABEL` translates to `@n`, where `n` is the instruction number following the `(LABEL)` declaration.

### HACK Machine Language: Variables

```
// Flip the values of RAM[0] and RAM[1]

@R1
D=M
@temp
M=D    // temp = R1

@R0
D=M
@R1
M=D    // R1 = R0

@temp
D=M
@R0
M=D    // R0 = temp

(END)
@END
0;JMP
```

A reference to a symbol that has no corresponding label declaration is treated as a reference to a variable, and variables are allocated to the RAM from address 16 onward. So, `@temp` finds some available memory register (say register `n`), and uses it to represent the variable temp. Each occurrence of `@temp` will be translated into `@n`.

### HACK Machine Language: Iteration

```
// PSEUDOCODE: Compute RAM[1] = 1+2+ ... +RAM[0]

	n = R0
	i = 1
	sum = 0
LOOP:
	if i > n goto STOP
	sum = sum + i
	i = i + 1
	goto LOOP
STOP:
	R1 = sum
```

```
// Compute RAM[1] = 1+2+ ... +n

@R0
D=M
@n
M=D   // n = R0
@i
M=1   // i = 1
@sum
M=0   // sum = 0

(LOOP)
@i
D=M
@n
D=D-M
@STOP
D;JGT // if i > n goto STOP

@sum
D=M
@i
D=D+M
@sum
M=D   // sum = sum + i
@i
M=M+1 // i = i + 1
@LOOP
0;JMP

(STOP)
@sum
D=M
@R1
M=D   // RAM[1] = sum

(END)
@END
0;JMP
```

To verify that the code works, a variable-value **trace table** can be used to simulate the program on paper and track the variables of interest:

|           | 0   | 1   | 2   | 3   | ... |
| --------- | --- | --- | --- | --- | --- |
| `RAM[0]`: | 3   |     |     |     |     |
| `n`:      | 3   |     |     |     |     |
| `i`:      | 1   | 2   | 3   | 4   | ..  |
| `sum`:    | 0   | 1   | 3   | 6   | ... |

### HACK Machine Language: Pointers
Take this example of a high-level language program that uses a for loop to fill in an array:

```
for (i=0; i<n; i++) {
	arr[i] = -1
}
```

We need to figure out how this maps to assembly, because there is no array data type when dealing with addresses in RAM. There must exist a variable `arr` which holds the address of the first value in the array, and a variable `n` which holds the length of that array.

Variables that store memory addresses like `arr` and `i` are called **pointers**. Whenever we have to access memory using a pointer, we need an instruction like `A=M`. The address register is typically set to the contents of some memory register.

```
// Suppose that arr=100 and n=10

// arr = 100
@100
D=A
@arr
M=D

// n=10
@10
D=A
@n
M=D

// initialize i = 0
@i
M=0

(LOOP)
// if (i==n) goto END
@i
D=M
@n
D=D-M
@END
D;JEQ

// RAM[arr+i] = -1
@arr
D=M
@i
A=D+M
M=-1

// i++
@i
M=M+1

@LOOP
0;JMP

(END)
@END
0;JMP
```

### HACK Machine Language: Input / Output

**Display Unit**

A **screen memory map** is a designated memory area dedicated to manage a display unit. The physical display is continuously refreshed from the memory map many times per second.

In the HACK computer, the **display unit** is a matrix consisting of 256 rows and 512 columns, with each intersection representing a pixel. In a black & white screen, each pixel can be either on or off. The memory map, which is a sequence of 16-bit values, contains a bit for every pixel on the display unit. 

The first 32 16-bit values in the memory map correspond with the first row of pixels in the display unit. To set a pixel *(row,col)* on or off:
1) `word = Screen[32*row + col/16]` (`Screen` represents the memory map)
    `word = RAM[16384 + 32*row + col/16]` (If accessing overall RAM)
2) Set the (`col %` 16)th bit of `word` to 0 or 1
3) Commit `word` to the RAM

(1) And (3) are done using 16-bit RAM access operations.

**Input Unit**

The physical keyboard is associated with a **keyboard memory map**, which is a single 16-bit register. When a key is pressed on the keyboard, the key's **scan code** appears in the keyboard memory map. When no key is pressed, the resulting code is 0. 

To check which key is currently pressed, probe the contents of the `Keyboard` chip. In the HACK computer: probe the contents of `RAM[24576]` (address `KBD`).

**Drawing a Rectangle**

```
// PSEUDOCODE
//
// for (i=0; i<n; i++) {
//    draw 16 black pixels at the beginning of row i
// }

addr = SCREEN
n = RAM[0]
i = 0

LOOP:
	if i > n goto END
	RAM[addr] = -1 //1111111111111111
	// advances to the next row
	addr = addr + 32
	i = i + 1
	goto LOOP
	
END:
	goto END
```

```
// ASSEMBLY CODE

	@SCREEN
	D=A
	@addr
	M=D    // addr = 16384 (screen's base address)

	@0
	D=M
	@n
	M=D    // n = RAM[0]

	@i
	M=0    // i = 0

(LOOP)
	@i
	D=M
	@n
	D=D-M
	@END
	D;JGT   // if i>n goto END
	
	@addr
	A=M
	M=-1    // RAM[addr]=1111111111111111
	
	@i
	M=M+1   // i = i + 1
	@32
	D=A
	@addr
	M=D+M   // addr = addr + 32
	@LOOP
	0;JMP   // goto LOOP
	
(END)
	@END    // program's end
	0;JMP   // infinite loop 
```

