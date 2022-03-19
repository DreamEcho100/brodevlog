import { NextPage, GetServerSideProps } from 'next';

import {
	VISITOR_PROFILE_GUEST,
	VISITOR_PROFILE_OWNER,
} from '@coreLib/constants';
import { TNewsData } from '@coreLib/ts/global';
import { IExtraReturns, TGetUsersPropFilterBy } from '@coreLib/db/pg/ts';
import pgActions from '@coreLib/db/pg/actions';
import { getCookie } from '@commonLibIndependent/storage/cookie/document';
import { itemsInObject } from '@commonLibIndependent/object';
import { IPropsUserProfilePageData } from '@store/ProfilePageContext/ts';
import { setUserProfilePageContextStore } from '@store/ProfilePageContext';

import UserProfileScreen from '@screens/Users/Profile';
import {
	ISetNewsContextStoreProps,
	setNewsContextStore,
} from '@store/newsContext';
import { INewsContextStateData } from '@store/newsContext/ts';

interface IProps {
	user: IPropsUserProfilePageData['user'];
	visitorStatus: IPropsUserProfilePageData['visitorStatus'];
	newsData: { news: TNewsData; hit_news_items_limit: boolean };
}

const UserProfilePage: NextPage<IProps> = (props) => {
	const { UserProfilePageContextSharedProvider } =
		setUserProfilePageContextStore({
			profileData: {
				user: props.user,
				visitorStatus: props.visitorStatus,
			},
		});

	const newsExtra: ISetNewsContextStoreProps['data']['newsExtra'] = {};
	const actions: ISetNewsContextStoreProps['actions'] = {
		items: {},
	};

	props.newsData.news.forEach((item, index) => {
		if (index === 0) {
			actions.items[item.news_id] = {
				init: {
					priorityForHeaderImageForFirstIndex: true,
				},
			};
		}

		newsExtra[item.news_id] = {
			hit_comments_limit: false,
			newsItemDetailsType: 'description',
			newsItemModelDetailsType: 'content',
		};
	});

	const { NewsContextSharedProvider } = setNewsContextStore({
		data: {
			news: props.newsData.news,
			newsExtra,
			hit_news_items_limit: !!props.newsData.hit_news_items_limit,
		},
		actions,
	});

	return (
		<NewsContextSharedProvider>
			<UserProfilePageContextSharedProvider>
				<UserProfileScreen />
			</UserProfilePageContextSharedProvider>
		</NewsContextSharedProvider>
	);
};

export const getServerSideProps: GetServerSideProps = async ({
	req,
	res,
	query,
}) => {
	const visitorUserNameId = getCookie('user_name_id', req.headers.cookie);

	if (typeof query.user_name_id !== 'string') {
		res.statusCode = 404;
		res.statusMessage = "query.user_name_id doesn't exist!";
		res.end();
		return {
			props: {},
		};
	}
	const profileData = {} as IPropsUserProfilePageData & {
		newsData: { news: TNewsData; hit_news_items_limit: boolean };
	};

	profileData.visitorStatus =
		visitorUserNameId && query.user_name_id === visitorUserNameId
			? VISITOR_PROFILE_OWNER
			: VISITOR_PROFILE_GUEST;
	const userFilterBy: TGetUsersPropFilterBy = [
		[
			{
				name: 'byUserNameId',
				value: query.user_name_id,
			},
		],
	];
	const userExtraReturns: IExtraReturns = {
		user_id: true,
		sensitiveInfo: profileData.visitorStatus === VISITOR_PROFILE_OWNER,
		// user_password
		// user_news_counter
	};

	profileData.user = await pgActions.users
		.get({
			extraReturns: userExtraReturns,
			filterBy: userFilterBy,
		})
		.then(
			(response: { rows: IPropsUserProfilePageData['user'][] }) =>
				response.rows[0]
		);

	if (!profileData.user) {
		res.statusCode = 404;
		res.statusMessage = 'User Not Found!';
		res.end();
		return {
			props: {},
		};
	}

	profileData.user.last_sign_in = profileData.user.last_sign_in.toString();
	profileData.user.created_at = profileData.user.created_at.toString();
	if (
		profileData.visitorStatus === VISITOR_PROFILE_OWNER &&
		profileData.user.date_of_birth
	) {
		profileData.user.date_of_birth = profileData.user.date_of_birth.toString();
	}

	/* */
	const { existingItems } = itemsInObject(query, [
		'filterByBlogTagsAnd',
		'filterByBlogTagsOr',
		// 'newsByUserId',
		// 'newsCreatedBefore',
		'isNewsVotedByUser',
		// 'with_news_blog_content',
	]);

	if (typeof existingItems.filterByBlogTagsAnd === 'string')
		existingItems.filterByBlogTagsAnd = JSON.parse(
			existingItems.filterByBlogTagsAnd
		);
	if (typeof existingItems.filterByBlogTagsOr === 'string')
		existingItems.filterByBlogTagsOr = JSON.parse(
			existingItems.filterByBlogTagsOr
		);

	profileData.newsData = await pgActions.news.get({
		...existingItems,
		newsByUserId: profileData.user.id,
	});

	profileData.newsData.news.forEach((item) => {
		item.updated_at = item.updated_at.toString();
		item.created_at = item.created_at.toString();
	});

	res.setHeader(
		'Cache-Control',
		'public, s-maxage=60, stale-while-revalidate=60'
	);

	return {
		props: profileData,
	};
};

export default UserProfilePage;
