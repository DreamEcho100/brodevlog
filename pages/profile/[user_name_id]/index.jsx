import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { getCookie } from '@lib/v1/cookie';

import { useUserSharedState } from '@store/UserContext';

import Profile from '@components/Profile';

const GUEST = 'GUEST';
const OWNER = 'OWNER';

const ProfilePage = ({ user = {}, ...props }) => {
	const router = useRouter();

	const [userState, userDispatch] = useUserSharedState();

	const newsFetchRouteQuery = props.newsFetchRouteQuery;
	const posts = useMemo(
		() =>
			props?.posts?.length !== 0
				? (() => {
						const formattedData = props.posts.map((obj) => {
							const formattedItem = {};
							let itemA;
							for (itemA in obj) {
								if (itemA !== 'type_data') {
									formattedItem[itemA] = obj[itemA];
								} else {
									let itemB;
									for (itemB in obj['type_data']) {
										formattedItem[itemB] = obj.type_data[itemB];
									}
								}
							}

							return formattedItem;
						});

						return formattedData;
				  })()
				: [],
		props.posts
	);

	const [handleIsAuthorized, setHandleIsAuthorized] = useState(
		user.isAuthorized
	);
	const [identity, setIdentity] = useState(user.visitorIdentity || GUEST);
	const [userData, setUserData] = useState(user.data);

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		(async () => {
			if (userState.isVerifyingUserLoading || !router.isReady) return;

			let userProfileData;

			if (userData?.user_name_id !== router.query.user_name_id) {
				setIsLoading(true);

				if (userState.user?.user_name_id === router.query.user_name_id) {
					userProfileData = userState.user;
				} else {
					const userResult = await fetch(
						`/api/v1/users/user/?user_name_id=${router.query.user_name_id}`
					).then((response) => response.json());

					if (
						!userResult.data ||
						!userResult.data.user_name_id ||
						(userResult.status && userResult.status === 'error')
					) {
						setUserData({});
						setPosts([]);
						setIsLoading(false);
						if (handleIsAuthorized) setHandleIsAuthorized(false);
						if (identity !== GUEST) setIdentity(GUEST);
						return;
					}

					userProfileData = userResult.data;
				}

				setUserData(userProfileData);

				let postInputQuery = '/?filter_by_user_id=';
				postInputQuery += userProfileData.id;

				if (userState.user?.id)
					postInputQuery += `&voter_id=${userState.user.id}`;

				setNewsFetchRouteQuery(postInputQuery);

				const postsResult = await fetch(`/api/v1/news${postInputQuery}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				})
					.then((response) => response.json())
					.catch((error) => {
						console.error(error);
						return {
							status: 'error',
							message: error.message || 'Something went wrong!',
							data: [],
						};
					});

				setPosts(
					postsResult.data.news.map((item) => {
						return {
							...item,
							...item.type_data,
							type_data: {},
						};
					})
				);

				setIsLoading(false);
			}

			if (isLoading) setIsLoading(false);
		})();
	}, [
		userState.isVerifyingUserLoading,
		router.query.user_name_id,
		router.isReady,
	]);

	useEffect(() => {
		if (userState.isVerifyingUserLoading || !userState.userExist) {
			if (handleIsAuthorized) setHandleIsAuthorized(false);
			if (identity !== GUEST) setIdentity(GUEST);
		} else {
			if (router.query.user_name_id === userState.user.user_name_id) {
				setUserData(userState.user);
				if (identity !== OWNER) setIdentity(OWNER);
				if (!handleIsAuthorized) setHandleIsAuthorized(true);
			} else if (router.query.user_name_id !== userState.user.user_name_id) {
				if (identity !== GUEST) setIdentity(GUEST);
				if (handleIsAuthorized) setHandleIsAuthorized(false);
			}
		}
	}, [
		userState.userExist,
		router.query.user_name_id,
		userState.isVerifyingUserLoading,
	]);

	// if (isLoading) {
	// 	return <p>Loading...</p>;
	// }

	return (
		<Profile
			userData={
				userState.user?.user_name_id === router.query.user_name_id
					? userState.user
					: userData
			}
			isLoadingSkeleton={isLoading}
			visitorIdentity={identity}
			news={posts}
			newsFetchRouteQuery={newsFetchRouteQuery}
		/>
	);
};

export const getServerSideProps = async ({ req, res, query }) => {
	let newsFetchRouteQuery = '';
	/*
		const baseUrl = `${
			process.env.NODE_ENV !== 'production' ? 'http' : 'https'
		}://${ctx.req.headers.host}`;
	*/
	const fetcher = async (tokenCookieString, userCookieString, user_name_id) => {
		const input = `${process.env.BACK_END_ROOT_URL}/api/v1/users/user/?user_name_id=${user_name_id}`;

		let user;
		let userCookieObj;
		let visitor_id;

		if (tokenCookieString.length !== 0 && userCookieString.length !== 0) {
			userCookieObj = JSON.parse(userCookieString);
			if (userCookieObj?.id) visitor_id = userCookieObj.id;
		}

		user = await fetch(input)
			.then((response) => response.json())
			.catch((error) => {
				console.error(error);
				return {
					status: 'error',
					message: error.message,
					data: {},
					isAuthorized: false,
					visitorIdentity:
						userCookieObj.user_name_id === user_name_id ? OWNER : GUEST,
				};
			});

		if (!user?.data?.id || (user && user.status === 'error')) {
			return {
				user,
				posts: {
					status: 'error',
					message: "Can't get the posts!",
					data: { news: undefined },
				},
			};
		}

		if (user?.data?.id)
			newsFetchRouteQuery += `/?filter_by_user_id=${user.data.id}`;
		else if (userCookieObj?.id && userCookieObj?.user_name_id === user_name_id)
			newsFetchRouteQuery += `/?filter_by_user_id=${userCookieObj.id}`;

		if (visitor_id) {
			if (newsFetchRouteQuery.length !== 0)
				newsFetchRouteQuery += `&voter_id=${visitor_id}`;
			else newsFetchRouteQuery += `/?voter_id=${visitor_id}`;
		}

		const posts = await fetch(
			`${process.env.BACK_END_ROOT_URL}/api/v1/news${newsFetchRouteQuery}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
			.then((response) => response.json())
			.catch((error) => {
				console.error(error);
				return {
					status: 'error',
					message: error.message || 'Something went wrong!',
					data: [],
				};
			});

		return {
			user: {
				...user,
				isAuthorized: user.data.user_name_id === user_name_id ? true : false,
				visitorIdentity:
					user.data.user_name_id === user_name_id ? OWNER : GUEST,
			},
			posts,
		};
	};

	let tokenCookieString = '';
	let userCookieString = '';
	if (req.headers.cookie) {
		tokenCookieString = getCookie({
			cookieName: 'user_token',
			cookieString: req.headers.cookie,
		});
		userCookieString = getCookie({
			cookieName: 'user_data',
			cookieString: req.headers.cookie,
		});
	}

	const data = await fetcher(
		tokenCookieString,
		userCookieString,
		query.user_name_id
	);

	return {
		props: {
			user: data.user ? data.user : {},
			posts: data?.posts?.data?.news ? data.posts.data.news : [],
			newsFetchRouteQuery,
		},
	};
};

export default ProfilePage;
