import { Dispatch, FC, ReactNode, SetStateAction } from 'react';
import { FaEllipsisV } from 'react-icons/fa';

import DropdownRoot from '@commonComponentsIndependent/Dropdown';
import DropdownTriggerMenu from '@commonComponentsIndependent/Dropdown/Trigger';
import DropdownList from '@commonComponentsIndependent/Dropdown/List';

interface IProps {
	isDropdownListVisible: boolean;
	setIsDropdownListVisible: Dispatch<SetStateAction<boolean>>;
	children: ReactNode;
}
const CustomDropdown: FC<IProps> = ({
	isDropdownListVisible,
	setIsDropdownListVisible,
	children,
}) => {
	return (
		<>
			<DropdownRoot
				setIsDropdownListVisible={setIsDropdownListVisible}
				isDropdownListVisible={isDropdownListVisible}
			>
				<DropdownTriggerMenu
					title='News item setting button'
					setIsDropdownListVisible={setIsDropdownListVisible}
				>
					<FaEllipsisV />
				</DropdownTriggerMenu>

				<DropdownList isDropdownListVisible={isDropdownListVisible}>
					{children}
				</DropdownList>
			</DropdownRoot>

			{/* {userData?.id && <></>} */}
		</>
	);
};

export default CustomDropdown;
