---
tags:
  - nand2tetris
date: 12/28/2025
---

# Fetch-Execute Cycle

The most basic task of a CPU is to fetch an instruction from program memory and then execute it. To fetch an instruction, the CPU must place the instruction’s memory address on the program memory’s address input and then read the instruction code stored at that location.

The hardware responsible for the fetch phase is the Program Counter (PC). The PC holds the address of the next instruction to be executed. After each instruction, or when a jump occurs, the PC is updated to point to a new address. The output of the PC is connected to the address input of program memory, and the memory’s output provides the instruction code to the CPU.

The instruction code specifies what operation to perform, which registers or memory locations to use, and whether control flow should change (for example, via a jump). Typically, different subsets of the instruction’s bits encode different aspects of this behavior. Executing an instruction therefore involves coordinating the ALU, registers, and sometimes data memory.

From a hardware perspective, the fetched instruction is loaded into the CPU and interpreted by the control unit, which drives the control signals of the system. These signals configure the ALU’s operation and select the sources and destinations of data.

**Fetch-Execute Conflict**

In a von Neumann system, both program instructions and data reside in the same memory. During the fetch phase, memory is accessed to retrieve the next instruction. During the execute phase, memory may also be accessed to read or write data. Because there is only a single memory module, these two uses cannot occur simultaneously, creating a fetch–execute conflict.

One way to manage this conflict is to perform the fetch and execute phases sequentially. A multiplexer is used to select which address is presented to memory: during the fetch phase, the multiplexer selects the program counter; during the execute phase, it selects the data address. To preserve the fetched instruction across phases, the instruction is stored in an instruction register for use during execution.

**Harvard Architecture**

A simpler architectural solution is the Harvard Architecture, a variant of the von Neumann model that uses separate memory modules for program instructions and data. This separation eliminates the fetch–execute conflict by allowing instruction fetches and data accesses to occur independently.