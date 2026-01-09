---
tags:
  - nand2tetris
date: 01/01/2026
---

# The HACK Assembler
### Translating A-Instructions
If the value is a **decimal constant**, generate the equivalent 15-bit binary constant.
If the value is a **symbol**, it falls into one of the following categories:

#### Variables
- Represent memory locations where the program stores values.
- Any symbol not defined elsewhere using the `(XXX)` directive is treated as a variable.
- Each variable is assigned a unique memory address starting at 16.
- When `@variableSymbol` is encountered for the first time, assign it the next available memory address.
- On subsequent encounters, replace `variableSymbol` with its assigned value.

#### Labels
- Represent destinations for `goto` instructions.
- Declared using pseudo-commands `(XXX)` (e.g. `(LOOP)`, `(STOP)`, `(END)`).
- When `@labelSymbol` appears, it refers to the memory location of the instruction immediately following the `(XXX)` declaration.
- Replace `labelSymbol` with its binary value.

#### Predefined Symbols
- Represent special memory locations.
- The Hack language defines 23 predefined symbols (`R0–R15`, `SCREEN`, `KBD`, etc.).
- Replace each predefined symbol with its corresponding binary value.

#### Symbol Table
- Initialize the symbol table with the 23 predefined symbols.
- First pass: scan the program and record label declarations while tracking instruction addresses.
- Second pass: handle variable symbols.
- To resolve a symbol, look it up in the symbol table.

### Translating C-Instructions
Every C-instruction begins with `111`.  
The next 7 bits correspond to the `comp` field, followed by 3 bits for the `dest` field, and 3 bits for the `jump` field.

Binary values are determined using the Hack binary syntax tables.

Example: `MD=D+1`  
The instruction is parsed into its `dest` and `comp` fields, each of which is translated using the syntax tables.

### Assembly Process
#### Initialization
Construct an empty symbol table and add all predefined symbols.

#### First Pass
Scan the program and, for each instruction of the form `(XXX)`, add `(XXX, address)` to the symbol table, where `address` is the instruction number following `(XXX)`.

#### Second Pass
Set `n = 16` and scan the program again. For each instruction:
- If the instruction is `@symbol`:
  - If `(symbol, value)` exists in the symbol table, use `value` to complete the translation.
  - Otherwise, add `(symbol, n)` to the symbol table, use `n` to complete the translation, and increment `n`.
- If the instruction is a C-instruction, complete the translation using the syntax tables.
- Write the resulting binary instruction to the output file.

### Final Step
Assemble each translated binary code into a complete 16-bit machine instruction and write it to the output file.



### Program Design

Parser: unpacks each instruction into its underlying fields

Code: translates each field into its corresponding binary value

SymbolTable: manages the symbol table

Main: initializes the I/O files and drives the process