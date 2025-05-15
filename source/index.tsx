import React, {useState, useEffect} from 'react';
import {Text, useInput} from 'ink';
import chalk from 'chalk';
import type {Except} from 'type-fest';

export type Props = {
	/**
	 * Text to display when `value` is empty.
	 */
	readonly placeholder?: string;

	/**
	 * Listen to user's input. Useful in case there are multiple input components
	 * at the same time and input must be "routed" to a specific component.
	 */
	readonly focus?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Replace all chars and mask the value. Useful for password inputs.
	 */
	readonly mask?: string;

	/**
	 * Whether to show cursor and allow navigation inside text input with arrow keys.
	 */
	readonly showCursor?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Highlight pasted text
	 */
	readonly highlightPastedText?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Whether to highlight all text when input receives focus
	 */
	readonly highlightOnFocus?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Value to display in a text input.
	 */
	readonly value: string;

	/**
	 * Function to call when value updates.
	 */
	readonly onChange: (value: string) => void;

	/**
	 * Function to call when `Enter` is pressed, where first argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;

	/**
	 * Text color
	 */
	readonly color?: string;

	/**
	 * Background color
	 */
	readonly backgroundColor?: string;

	/**
	 * Dim the text
	 */
	readonly dimColor?: boolean;

	/**
	 * Make the text bold
	 */
	readonly bold?: boolean;

	/**
	 * Make the text italic
	 */
	readonly italic?: boolean;

	/**
	 * Underline the text
	 */
	readonly underline?: boolean;

	/**
	 * Strike through the text
	 */
	readonly strikethrough?: boolean;
};

function TextInput({
	value: originalValue,
	placeholder = '',
	focus = true,
	mask,
	highlightPastedText = false,
	showCursor = true,
	highlightOnFocus = false,
	onChange,
	onSubmit,
	color,
	backgroundColor,
	dimColor,
	bold,
	italic,
	underline,
	strikethrough,
}: Props) {
	const [state, setState] = useState({
		cursorOffset: (originalValue || '').length,
		cursorWidth: 0,
		isHighlighted: false,
	});

	const {cursorOffset, cursorWidth, isHighlighted} = state;

	// Effect to handle focus changes and initial highlighting
	useEffect(() => {
		if (focus && highlightOnFocus) {
			setState(previousState => ({
				...previousState,
				isHighlighted: true,
				cursorOffset: originalValue.length,
			}));
		} else if (!focus) {
			setState(previousState => ({
				...previousState,
				isHighlighted: false,
			}));
		}
	}, [focus, highlightOnFocus]);

	// Separate effect to handle cursor position when value changes
	useEffect(() => {
		if (cursorOffset > originalValue.length) {
			setState(previousState => ({
				...previousState,
				cursorOffset: originalValue.length,
			}));
		}
	}, [originalValue, cursorOffset]);

	const cursorActualWidth = highlightPastedText ? cursorWidth : 0;

	const value = mask ? mask.repeat(originalValue.length) : originalValue;
	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

	// Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
	if (showCursor && focus && !isHighlighted) {
		renderedPlaceholder =
			placeholder.length > 0
				? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: chalk.inverse(' ');

		renderedValue = value.length > 0 ? '' : chalk.inverse(' ');

		let i = 0;

		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorActualWidth && i <= cursorOffset
					? chalk.inverse(char)
					: char;

			i++;
		}

		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += chalk.inverse(' ');
		}
	} else if (isHighlighted) {
		// When text is highlighted, show all text as inverse
		renderedValue = chalk.inverse(value);
		renderedPlaceholder = placeholder ? chalk.inverse(placeholder) : undefined;
	}

	useInput(
		(input, key) => {
			if (
				key.upArrow ||
				key.downArrow ||
				(key.ctrl && input === 'c') ||
				key.tab ||
				(key.shift && key.tab)
			) {
				return;
			}

			if (key.return) {
				if (onSubmit) {
					onSubmit(originalValue);
				}

				return;
			}

			let nextCursorOffset = cursorOffset;
			let nextValue = originalValue;
			let nextCursorWidth = 0;
			let nextIsHighlighted = isHighlighted;

			if (key.leftArrow) {
				if (showCursor) {
					nextCursorOffset--;
					nextIsHighlighted = false;
				}
			} else if (key.rightArrow) {
				if (showCursor) {
					nextCursorOffset++;
					nextIsHighlighted = false;
				}
			} else if (key.backspace || key.delete) {
				if (cursorOffset > 0) {
					nextValue =
						originalValue.slice(0, cursorOffset - 1) +
						originalValue.slice(cursorOffset, originalValue.length);

					nextCursorOffset--;
					nextIsHighlighted = false;
				}
			} else {
				// If text is highlighted, replace the entire value
				if (isHighlighted) {
					nextValue = input;
					nextCursorOffset = input.length;
				} else {
					nextValue =
						originalValue.slice(0, cursorOffset) +
						input +
						originalValue.slice(cursorOffset, originalValue.length);

					nextCursorOffset += input.length;
				}

				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
				nextIsHighlighted = false;
			}

			if (cursorOffset < 0) {
				nextCursorOffset = 0;
			}

			if (cursorOffset > originalValue.length) {
				nextCursorOffset = originalValue.length;
			}

			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
				isHighlighted: nextIsHighlighted,
			});

			if (nextValue !== originalValue) {
				onChange(nextValue);
			}
		},
		{isActive: focus},
	);

	return (
		<Text
			color={color}
			backgroundColor={backgroundColor}
			dimColor={dimColor}
			bold={bold}
			italic={italic}
			underline={underline}
			strikethrough={strikethrough}
		>
			{placeholder
				? value.length > 0
					? renderedValue
					: renderedPlaceholder
				: renderedValue}
		</Text>
	);
}

export default TextInput;

type UncontrolledProps = {
	/**
	 * Initial value.
	 */
	readonly initialValue?: string;
} & Except<Props, 'value' | 'onChange'>;

export function UncontrolledTextInput({
	initialValue = '',
	...props
}: UncontrolledProps) {
	const [value, setValue] = useState(initialValue);

	return <TextInput {...props} value={value} onChange={setValue} />;
}
