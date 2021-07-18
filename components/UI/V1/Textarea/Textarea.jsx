import classes from './Textarea.module.css';
import BorderClasses from '../Border.module.css';

import { handleAllClasses } from '../utils/index';

const Textarea = ({
	defaultClasses = 'textarea',
	extraClasses = '',
	className = '',
	children,
	onChange,
	setValues,
	...props
}) => {
	const allClasses = handleAllClasses({
		classes,
		defaultClasses,
		extraClasses,
		className,
	});

	return (
		<textarea
			className={allClasses}
			className={`${allClasses} ${BorderClasses['border-2']}`}
			onChange={(event) => {
				if (setValues) {
					return setValues((prev) => ({
						...prev,
						[event.target.name]: event.target.value,
					}));
				}
				if (onChange) return onChange(event);
			}}
			{...props}
		>
			{children}
		</textarea>
	);
};

export default Textarea;
