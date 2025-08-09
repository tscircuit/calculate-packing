# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`calculate-packing` is a TypeScript library that implements a box-pin component placement algorithm. It automatically arranges components to avoid collisions while minimizing trace length and keeping electrically connected pads close together.

## Development Commands

### Building

- `bun run build` - Build the library (outputs ESM + TypeScript declarations to dist/)
- `bun run build:site` - Export React Cosmos as static site

### Testing

- `bun test` - Run all tests
- `bun test <filename>` - Run specific test file

### Code Quality

- `bun run format` - Format code with Biome
- `bun run format:check` - Check formatting without changes
- `bun run typecheck` - Run TypeScript type checking

### Development

- `bun run start` - Start React Cosmos dev environment for interactive component development

## Architecture

### Core Algorithm Structure

The packing algorithm is implemented in `/lib/PackSolver/PhasedPackSolver.ts` and works in phases:

1. Sorts components by size (largest first or whatever `packOrderStrategy` is set to)
2. Maintains an outline of packed components
3. Probes outline segments for placement points
4. Evaluates 4 rotations (or available rotations) and selects best non-overlapping configuration

### Key Directories

- `/lib/PackSolver/` - Main solver implementation with PhasedPackSolver
- `/lib/geometry/` - Computational geometry utilities (convex hull, bounds calculations)
- `/lib/math/` - Low-level math operations (rotations, cross products)
- `/lib/plumbing/` - Format conversion between circuit-json and pack formats
- `/lib/solver-utils/` - Base solver classes and interfaces

### Testing Infrastructure

- Tests use Bun's built-in test runner with SVG snapshot testing
- SVG snapshots are compared using `bun-match-svg` library
- Visual regression testing generates PNG diffs for failures
- Test fixtures use circuit-json format

### Public API

The library exports 5 main functions:

- `pack()` - Main solver function that takes PackInput and returns PackOutput
- `convertPackOutputToPackInput()` - Converts output back to input format
- `convertCircuitJsonToPackOutput()` - Converts tscircuit format to pack output
- `getGraphicsFromPackOutput()` - Generates debug visualization
- Type definitions for PackInput, PackOutput, etc.

## Important Development Notes

- This project uses Bun as the primary runtime and test runner
- Code style is enforced by Biome with kebab-case filenames
- React Cosmos fixtures use `.page` suffix
- The solver must handle edge cases like zero-size components and maintain deterministic behavior
- When modifying the packing algorithm, always run the full test suite as there are many edge cases covered by snapshot tests
