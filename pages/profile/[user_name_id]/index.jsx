import { useCallback, useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/router';
import { getCookie } from '@lib/v1/cookie';
import { getNews } from '@lib/v1/pg/news';
import { useUserSharedState } from '@store/UserContext';
import { NewsContextSharedProvider } from '@store/NewsContext';

import Profile from '@components/Profile';
import pg from '@lib/v1/pg';

const ProfilePage = ({ user = {}, ...props }) => {
	console.log('user', user);
	const router = useRouter();

	const SETTING_USER_AND_POSTS_DATA = 'SETTING_USER_AND_POSTS_DATA';
	const SETTING_AUTHORIZATION_AND_IDENTITY =
		'SETTING_AUTHORIZATION_AND_IDENTITY';

	const GUEST = 'GUEST';
	const OWNER = 'OWNER';

	const profileInitialState = {
		userData: {},
		formattedPosts: [],
		newsFetchRouteQuery: '',
		visitorIdentity: 'Guest',
		isAuthorized: false,
		isLoading: true,
	};

	const profileReducer = (state, action) => {
		switch (action.type) {
			case SETTING_USER_AND_POSTS_DATA: {
				const {
					userData,
					newsFetchRouteQuery,
					formattedPosts,
					visitorIdentity,
					isAuthorized,
				} = action.payload;

				if (
					state.userData.id !== userData.id ||
					state.newsFetchRouteQuery !== newsFetchRouteQuery ||
					state.formattedPosts.reduce(
						(currString, currPost) => currString + currPost.updated_at,
						''
					) !==
						formattedPosts.reduce(
							(currString, currPost) => currString + currPost.updated_at,
							''
						) ||
					state.visitorIdentity !== visitorIdentity ||
					state.isAuthorized !== isAuthorized
				)
					return {
						...state,
						userData,
						newsFetchRouteQuery,
						formattedPosts,
						visitorIdentity,
						isAuthorized,
					};

				return state;
			}

			case SETTING_AUTHORIZATION_AND_IDENTITY: {
				const { visitorIdentity, isAuthorized } = action.payload;

				if (
					state.visitorIdentity !== visitorIdentity ||
					state.isAuthorized !== isAuthorized
				)
					return {
						...state,
						visitorIdentity,
						isAuthorized,
						isLoading: false
					};

				return {
					...state,
					isLoading: false
				};
			}

			default: {
				return state;
			}
		}
	};

	const [profileState, profileDispatch] = useReducer(profileReducer, {
		...profileInitialState,
		userData: user?.data?.id ? user.data : {},
		formattedPosts: (() => {
			const formattedPosts = [];
	
			if (props?.posts?.length !== 0) {
				props.posts.forEach((obj) => {
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
	
					formattedPosts.push(formattedItem);
				});
			}
	
			return formattedPosts;
		})(),
		newsFetchRouteQuery: props.newsFetchRouteQuery || '',
		isLoading: true,
	});
	const [userState, userDispatch] = useUserSharedState();

	const handleSettingAuthorizationAndIdentity = useCallback(() => {
		const payload = {
			visitorIdentity: GUEST,
			isAuthorized: false,
		};

		if (
			userState.userExist &&
			router.query.user_name_id === userState.user.user_name_id
		) {
			payload.visitorIdentity = OWNER;
			payload.isAuthorized = true;
		}

		profileDispatch({
			type: SETTING_AUTHORIZATION_AND_IDENTITY,
			payload,
		});
	}, [
		profileDispatch,
		userState.user,
		router.query.user_name_id,
		userState.userExist,
	]);

	useEffect(() => {
		if (!router.isReady && userState.isVerifyingUserLoading) return;

		handleSettingAuthorizationAndIdentity();
	}, [
		router.isReady,
		userState.userExist,
		router.query.user_name_id,
		userState.isVerifyingUserLoading,
		userState.user?.user_name_id,
		handleSettingAuthorizationAndIdentity,
	]);

	return (
		<NewsContextSharedProvider>
			<Profile
				userData={profileState.userData?.id === userState.user?.id ? userState.user : profileState.userData}
				isLoadingSkeleton={profileState.isLoading}
				visitorIdentity={profileState.visitorIdentity}
				news={profileState.formattedPosts}
				newsFetchRouteQuery={profileState.newsFetchRouteQuery}
			/>
		</NewsContextSharedProvider>
	);
};

export const getServerSideProps = async ({ req, res, query }) => {
	const GUEST = 'GUEST';
	const OWNER = 'OWNER';
	let newsFetchRouteQuery = '';

	const fetcher = async (tokenCookieString, userCookieString, user_name_id) => {
		const data = {
			user: {
				// isAuthorized: user.data.user_name_id === user_name_id ? true : false,
				// visitorIdentity:
				// 	user.data.user_name_id === user_name_id ? OWNER : GUEST,
				data: {}
			},
			posts: {
				news: []
			},
		};
		let userCookieObj;
		let visitor_id;


		try {
			if (tokenCookieString.length !== 0 && userCookieString.length !== 0) {
				userCookieObj = JSON.parse(userCookieString);
				if (userCookieObj?.id) visitor_id = userCookieObj.id;
			}

			await pg.users
				.get({
					filterBy: [
						[
							{
								name: 'user_name_id',
								value: user_name_id,
								// priority: 'AND',
							},
						],
					],
				})
				.then((result) => {
					console.log('result', result);
					if (result[0]) {
						data.user.data = result[0];
						data.user.data.last_sign_in = '' + data.user.data.last_sign_in;
						data.user.data.created_at = '' + data.user.data.created_at;

					}
				});

				const filters = {};

				if (data.user.data.id) {
					filters.newsByUserId = data.user.data.id;
					newsFetchRouteQuery += `/?newsByUserId=${filters.newsByUserId}`;
					if (visitor_id) {
						if (newsFetchRouteQuery.length !== 0) {
							filters.newsVotedByUser = visitor_id;
							newsFetchRouteQuery += `&newsVotedByUser=${filters.newsVotedByUser}`;
						}
						else {
							filters.newsVotedByUser = visitor_id;
							newsFetchRouteQuery += `/?newsVotedByUser=${filters.newsVotedByUser}`;
						}
					}
					
					data.posts = await getNews(filters);
			
					if (data?.posts?.news) {
						data.posts.news.forEach((item, index) => {
							item.updated_at = '' + item.updated_at;
							item.created_at = '' + item.created_at;
						});
					}
				}
				// else if (userCookieObj?.id && userCookieObj?.user_name_id === user_name_id) {
				// 	filters.newsByUserId = userCookieObj.id;
				// 	newsFetchRouteQuery += `/?newsByUserId=${filters.newsByUserId}`;
				// }
		} catch (error) {
			console.error(error.message);
		}
		console.log('data', data);
		
		return data;
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
	console.log('data', data);

	return {
		props: {
			user: data.user,
			posts: data.posts.news,
			newsFetchRouteQuery,
		},
	};
};

export default ProfilePage;
