"use client";

import { Dropdown } from "./Dropdown";
import type { DropdownOption, DropdownProps, DropdownSize, DropdownVariant } from "./Dropdown";

export type SelectOption<T extends string | number = string> = DropdownOption<T>;
export type SelectProps<T extends string | number = string> = DropdownProps<T>;
export type { DropdownOption, DropdownProps, DropdownSize, DropdownVariant };

export const Select = Dropdown;
export { Dropdown };
export default Dropdown;
