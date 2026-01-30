---
tags:
  - nand2tetris
date: 01/17/2026
---

# Virtual Machine

<font size=2>These are my notes from the Nand2Tetris course, covering hardware construction, computer architecture, virtual machines, and low-level software built from first principles. My project files from this course can be found on <a href="https://github.com/sreegjl/nand2tetris" target="_blank">GitHub</a>.</font>

A virtual machine (VM) is an example of virtualization, in which an abstract computational model is implemented on top of different underlying hardware platforms. By defining a standard intermediate execution model, a virtual machine allows programs to be written independently of any specific processor or machine language. In this sense, a virtual machine can be viewed as a practical realization of a universal Turing machine, capable of executing any computable program given an appropriate encoding.

Ideally, we would like any high-level program that we write to be able to compile on any platform. The problem is that different devices use different processors with different machine languages. Instead of creating multiple compilers, we can use a "write once, run anywhere" approach.

An example of this is Java, which doesn't compile down to machine language, but rather uses **two-tier compilation**. The first tier translates the Java program into VM code (bytecode), which is designed to run on a Virtual Machine. To execute this bytecode, we need the second tier, in which we equip the target device with JVM implementation, which is a program that takes bytecode and translates it into the target code of the target platform. By introducing the intermediate level, we can decouple the complex process into two separate standard subprocesses: the compiler (to get VM code) and the VM translator (to target hardware machine language).

## VM Abstraction

In a stack machine model implementation of a virtual machine, a compiler first translates a high-level program into VM code. This VM code operates by manipulating a stack using a fixed set of command categories: **arithmetic and logical commands, memory segment commands, branching commands, and function commands.**

### The Stack

A stack is a last-in, first-out (LIFO) data structure used as an execution abstraction in computer systems, particularly for expression evaluation, function calls, and temporary storage.

The two fundamental stack operations are:
- **push**: stores a value at the address indicated by the stack pointer, then advances the pointer
- **pop**: retrieves the most recently stored value, then decrements the pointer

At all times, the stack pointer indicates the location of the next push operation.

### VM Command Categories

#### Arithmetic Commands

Any arithmetic or logical expression can be expressed and evaluated by applying some sequence of VM code operations on the stack.

<img src="files/images/ArithmeticLogicalCommands.png" alt="Arithmetic & Logical Commands">

In stack-based arithmetic, operations consume their operands directly from the stack. For example, the `add` operation pops the two topmost values from the stack, computes their sum, and pushes the result back onto the stack. Unary operations such as `neg` similarly pop a single value, apply the operation, and push the result.

**Example: Evaluating an expression**
```
// d = (2 - x) + (y + 9)

push 2        // stack: [2]
push x        // stack: [2, x]
sub           // stack: [2 - x]

push y        // stack: [2 - x, y]
push 9        // stack: [2 - x, y, 9]
add           // stack: [2 - x, y + 9]

add           // stack: [(2 - x) + (y + 9)]
pop d         // stack: []        ; d = (2 - x) + (y + 9)
```

More generally, to apply a function $f$ in a stack machine, the machine pops the required argument(s) from the stack, computes $f$ on those values, and pushes the result onto the stack. Boolean and comparison operations follow the same pattern, producing values that can be used for control flow and further computation.

#### Memory Segment Commands

<img src="files/images/MemorySegments.png" alt="Memory Segments">

When compiling high-level code, the different roles of variables (argument variables, local variables, static variables, etc.) are not preserved directly in the resulting VM code. To retain this semantic information, the virtual machine abstraction introduces **memory segments**, which allow the compiler to map variables to distinct logical regions of memory.

The eight memory segments are: **local, argument, this, that, constant, static, pointer, and temp**.

Instead of emitting raw memory addresses, the compiler generates segment-based commands such as `push static 1` or `pop local 2`. The VM implementation is then responsible for translating these segment references into concrete memory addresses on the target platform.

During execution, values stored in memory segments are brought into the stack when needed and written back out once computation is complete. The stack thus serves as a temporary workspace, while memory segments provide persistent storage for variables across expressions and function calls.

#### Branching Commands

Branching commands enable control flow:
```
label label           // Define a label
goto label            // Unconditional jump
if-goto label         // Conditional jump (pops stack, jumps if non-zero)
```

#### Function Commands

Function commands support procedure calls and returns:
```
function functionName nVars  // Declare function with n local variables
call functionName nArgs      // Call function with n arguments
return                       // Return from function
```

---

## Implementation: The VM Translator 

Once a high-level program has been translated into VM code, the next step is to realize this abstract stack-based model on the actual Hack hardware. Since the VM language is defined in terms of conceptual operations on a stack and a set of logical memory segments, these commands must be implemented using the concrete resources of the Hack platform: its registers, RAM layout, and instruction set. The VM implementation layer bridges this gap by translating each VM command into a sequence of Hack assembly instructions that faithfully carry out the VM’s arithmetic, memory, branching, and function operations.

### Hardware Fundamentals

#### Pointer and Memory Access

In the Hack platform, pointers are implemented using RAM locations that store addresses. If we use symbols `p` and `q` to refer to RAM locations, then `*p` denotes the memory location that `p` points to.

**Example RAM state:**
```
RAM[0] = 257     // p
RAM[1] = 1024    // q
RAM[2] = 1765
...
RAM[256] = 19
RAM[257] = 23
RAM[258] = 903
...
RAM[1024] = 5
RAM[1025] = 12
RAM[1026] = -3
```

**Pointer operations (pseudo-assembly):**
```
D = *p  // D becomes 23 (value at RAM[257])

p--     // RAM[0] becomes 256
D = *p  // D becomes 19 (value at RAM[256])

*q = 9  // RAM[1024] becomes 9
q++     // RAM[1] becomes 1025
```

#### Stack Pointer and Stack Operations

In the Hack machine, the stack pointer (SP) is stored in `RAM[0]`, and the stack base address is `256`.

**Example: Pushing constant 17 to the stack**

Pseudo-assembly:
```
*SP = 17
SP++
```

Actual Hack assembly:
```
@17    // D=17
D=A
@SP    // *SP=D
A=M
M=D
@SP    // SP++
M=M+1
```

In general, a `push constant i` command in the VM language is represented conceptually as `*SP = i` followed by `SP++`. The VM Translator takes each VM command and expands it into the corresponding Hack assembly instructions that implement the behavior on real hardware, typically generating several assembly instructions per VM command.

### Implementing Memory Segments

The VM translator must map each of the eight memory segments onto the Hack hardware. Each segment has specific implementation requirements based on its purpose.

**Summary of memory segment mappings:**

| Segment | Type | Implementation |
|---------|------|----------------|
| `local`, `argument`, `this`, `that` | Dynamic | Base addresses in `LCL`, `ARG`, `THIS`, `THAT` (RAM[1-4])<br>`segment i` → `RAM[segmentPointer + i]` |
| `constant` | Virtual | `constant i` → supplies literal value `i` |
| `static` | Global | `static i` in `Foo.vm` → assembly variable `Foo.i` (RAM[16-255]) |
| `temp` | Fixed | RAM addresses 5–12<br>`temp i` → `RAM[5 + i]` |
| `pointer` | Fixed | RAM addresses 3–4<br>`pointer 0` → `THIS`, `pointer 1` → `THAT` |

**Standard pointer locations:**
- `RAM[0]` = SP (stack pointer)
- `RAM[1]` = LCL (local segment base)
- `RAM[2]` = ARG (argument segment base)
- `RAM[3]` = THIS (this segment base)
- `RAM[4]` = THAT (that segment base)

#### Dynamic Segments: `local`, `argument`, `this`, `that`

These four segments are allocated dynamically and can reside anywhere in RAM. The VM compiler maps a method's local and argument variables onto the `local` and `argument` segments, and maps the object fields and array entries that the method is currently working with onto the `this` and `that` segments.

Each segment is accessed via a base pointer stored in RAM:
- `local` segment base: `LCL` in `RAM[1]`
- `argument` segment base: `ARG` in `RAM[2]`
- `this` segment base: `THIS` in `RAM[3]`
- `that` segment base: `THAT` in `RAM[4]`

**Example: Accessing `local 2`**

If `RAM[1] = 1015` (LCL base address), then `local 2` refers to `RAM[1015 + 2] = RAM[1017]`.

Executing `pop local 2` when the stack top contains `5` will store `5` in `RAM[1017]`.

**Implementation in pseudo-assembly:**
```
// pop local i
addr = LCL + i
SP--
*addr = *SP

// push local i
addr = LCL + i
*SP = *addr
SP++
```

The same pattern applies to `argument`, `this`, and `that` segments, using their respective base pointers.

#### Virtual Segment: `constant`

The `constant` segment is virtual—it doesn't occupy actual RAM. The command `push constant i` supplies the literal value `i` directly.

**Key properties:**
- Only `push constant i` exists (no `pop constant`)
- The value `i` is not read from memory but used as a literal
- This is how constants in high-level code become VM operations

**Implementation in pseudo-assembly:**
```
// push constant i
*SP = i
SP++
```

#### Global Segment: `static`

Static variables have program-wide scope and must be visible to all methods. Unlike local or argument variables which are function-scoped, static variables persist across function calls.

The VM translator implements this by mapping each `static i` reference in file `Foo.vm` to an assembly variable `Foo.i`. This creates globally unique variable names.

**Example translation:**

VM code (from `Foo.vm`):
```
pop static 5
pop static 2
```

Generated assembly:
```
// D = stack.pop (code omitted)
@Foo.5
M=D

// D = stack.pop (code omitted)
@Foo.2
M=D
```

The Hack assembler then maps these symbolic references to `RAM[16]` through `RAM[255]` in the order they appear, placing them outside the stack region.

#### Fixed Segment: `temp`

The `temp` segment provides 8 temporary storage locations mapped to fixed RAM addresses `RAM[5]` through `RAM[12]`. The VM compiler uses these for temporary variables during expression evaluation.

**Implementation in pseudo-assembly:**
```
// push temp i
addr = 5 + i
*SP = *addr
SP++

// pop temp i
addr = 5 + i
SP--
*addr = *SP
```

For example, `temp 0` maps to `RAM[5]`, `temp 1` to `RAM[6]`, and so on.

#### Fixed Segment: `pointer`

The `pointer` segment provides direct access to the `THIS` and `THAT` segment base pointers. It has only two entries mapped to fixed RAM locations:
- `pointer 0` → `THIS` (`RAM[3]`)
- `pointer 1` → `THAT` (`RAM[4]`)

This segment allows the VM to manipulate the base addresses of the `this` and `that` segments, which is essential for object and array operations.

**Implementation in pseudo-assembly:**
```
// push pointer 0/1
*SP = THIS/THAT
SP++

// pop pointer 0/1
SP--
THIS/THAT = *SP
```

For example, `pop pointer 0` sets the `THIS` base pointer to the value on top of the stack.

### Proposed Implementation

The implementation can be divided into three main classes:
- **Parser**: Parses each VM command into its lexical elements
	- `Constructor`: Opens the input file and gets ready to parse it
	- `hasMoreCommands`: Boolean to check if there are more commands in the input
	- `advance`: If `hasMoreCommands` is true, read the next command from the input and make it the `current` command
	- `commandType`: Returns a constant representing the type of the current command (`C_ARITHMETIC`, `C_PUSH`, `C_POP`, `C_LABEL`, `C_GOTO`, `C_IF`, `C_FUNCTION`, `C_RETURN`, `C_CALL`)
	- `arg1()`: Returns the first argument of the current command
	    - For `C_ARITHMETIC`, the command itself is returned (for example `add`, `sub`, `neg`)
	    - Should not be called if the current command is `C_RETURN`
	- `arg2()`: Returns the second argument of the current command (as an `int`)
	    - Should be called only if the current command is `C_PUSH`, `C_POP`, `C_FUNCTION`, or `C_CALL`
- **CodeWriter**: Writes the assembly code that implements the parsed command
	- `Constructor(outputFile)`: Opens the output file or stream and gets ready to write assembly instructions into it
	- `writeArithmetic(command)`: Writes the assembly code that implements the given arithmetic command (for example `add`, `sub`, `neg`, `eq`, `gt`, `lt`, `and`, `or`, `not`)
	- `writePushPop(command, segment, index)`: Writes the assembly code that implements the given push or pop command
	    - `command` is either `C_PUSH` or `C_POP`
	    - `segment` is a string such as `local`, `argument`, `static`, etc.
	    - `index` is the integer offset
	- `close()`: Closes the output file
- **Main**: Drives the process (VMTranslator)

Main (VMTranslator)
- Input: fileName.vm
- Output: fileName.asm