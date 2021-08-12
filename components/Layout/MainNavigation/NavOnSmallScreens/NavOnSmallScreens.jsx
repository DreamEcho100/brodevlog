import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import NavOnSmallScreensClasses from './NavOnSmallScreens.module.css';
import MainNavigationClasses from '../MainNavigation.module.css';
import Button from '../../../UI/V1/Button';

const NavOnSmallScreens = ({ user, isLoading, handleSignOut }) => {
	const [showNavOnSmallScreens, setShowNavOnSmallScreens] = useState(false);

	return (
		<>
			<nav className={NavOnSmallScreensClasses['nav']}>
				<div className={MainNavigationClasses['logo']}>
					<Link href={'/' /*!isLoading && user.id ? '/posts/all' : '/'*/}>
						<a className={MainNavigationClasses.logo_anchor}>LogNMaze</a>
					</Link>
				</div>
				<button
					onClick={() => setShowNavOnSmallScreens(!showNavOnSmallScreens)}
					className={`${NavOnSmallScreensClasses['menu-toggle-button']} ${
						showNavOnSmallScreens ? NavOnSmallScreensClasses.active : ''
					}`}
				>
					<span
						className={`${NavOnSmallScreensClasses['line-1']} ${NavOnSmallScreensClasses['line']}`}
					></span>
					<span
						className={`${NavOnSmallScreensClasses['line-2']} ${NavOnSmallScreensClasses['line']}`}
					></span>
					<span
						className={`${NavOnSmallScreensClasses['line-3']} ${NavOnSmallScreensClasses['line']}`}
					></span>
				</button>
			</nav>
			<div
				className={`${NavOnSmallScreensClasses['wrapper']} ${
					showNavOnSmallScreens ? NavOnSmallScreensClasses['active'] : ''
				}`}
				onClick={() => setShowNavOnSmallScreens(!showNavOnSmallScreens)}
			></div>
			<div
				className={`${NavOnSmallScreensClasses['main-left-side-menu']} ${
					showNavOnSmallScreens ? NavOnSmallScreensClasses['show-nav'] : ''
				}`}
			>
				<ul className={`${NavOnSmallScreensClasses['main-list']}`}>
					{/* <li>
						<span onClick={() => setShowNavOnSmallScreens(false)}>
							<Link href='/posts/all'>All Posts</Link>
						</span>
					</li> */}
					{!isLoading && user.id && (
						<li>
							<span onClick={() => setShowNavOnSmallScreens(false)}>
								<Link href={`/profile/${user.user_name_id}`}>
									<a>
										<FontAwesomeIcon icon={['fas', 'user']} /> Profile
									</a>
								</Link>
							</span>
						</li>
					)}
					{!isLoading && !user.id && (
						<li>
							<span onClick={() => setShowNavOnSmallScreens(false)}>
								<Link href='/auth'>Sign In/Up</Link>
							</span>
						</li>
					)}
					{!isLoading && user.id && (
						<li>
							<span onClick={() => setShowNavOnSmallScreens(false)}>
								<Button defaultClasses='button-2' onClick={handleSignOut}>
									Sign Out
								</Button>
							</span>
						</li>
					)}
				</ul>
			</div>
		</>
	);
};

export default NavOnSmallScreens;
