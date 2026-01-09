---
tags:
  - nand2tetris
date: 12/28/2025
---

# Von Neumann Architecture

<font size=2>These are my notes from the Nand2Tetris course, covering hardware construction, computer architecture, virtual machines, and low-level software built from first principles. My project files from this course can be found on <a href="https://github.com/sreegjl/nand2tetris" target="_blank">GitHub</a>.</font>

In theory, a universal Turing machine can execute any computable program. The von Neumann architecture is a practical realization of this idea in real computers.

At a high level, the architecture consists of:
- A single memory that stores both data and program instructions
- A CPU that fetches and executes those instructions

The CPU itself is composed of two main parts:
- The ALU, which performs arithmetic and logical operations. 
- A set of registers, which hold values and intermediate results needed during computation

During execution, the system manipulates three fundamental kinds of information:
- **Data**: the values being processed (for example, numbers used in calculations)
- **Addresses**: references that indicate _where_ data or instructions are located in memory
- **Control**: signals that coordinate the operation of the system, determining which actions occur at each step
These three pieces of information are implemented as a set of wires called buses.

**Arithmetic Logic Unit**

The ALU is responsible for performing arithmetic and logical operations on data. It must be able to receive input values and produce output values, which requires data buses for both input and output. In addition, the ALU is connected to the control bus, which specifies which operation to perform, and allows the ALU’s results to influence the behavior of other system components.

**Data Registers**

Data registers temporarily store values used during computation. They rely on data buses to receive inputs and to forward stored values to other parts of the system, such as the ALU. Registers are also associated with address buses, since memory addresses for accessing RAM or ROM are often held in registers.

**Memory**

Interacting with memory requires both address buses and data buses. Address buses specify which memory location is being accessed, while data buses are used to read from or write to that location. The system typically separates memory into data memory, which stores values to be operated on, and program memory, which stores instructions. Program memory outputs instructions that may contain embedded data, but also encode control information; this control information is extracted and routed onto the control bus to direct the operation of the rest of the system.
