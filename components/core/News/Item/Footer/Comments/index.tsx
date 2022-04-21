import {
	FC,
	FormEvent,
	useCallback,
	useEffect,
	useReducer,
	useState,
} from 'react';

import helpersClasses from '@styles/helpers.module.css';

import { TNewsItemCommentsMain, TNewsItemData } from '@coreLib/ts/global';
import { useUserSharedState } from '@store/UserContext';

import Comment from './Comment';
import CommentTextarea from './CommentTextarea';
import { useNewsSharedState } from '@store/NewsContext';
import ButtonComponent from '@commonComponentsIndependent/Button';
import {
	createNewsItemMainComment,
	getMoreNewsItemCommentsMain,
} from './utils/actions';
import commentsRequestsReducer from './utils/reducer';
import { useNewsItemExtraDataSharedState } from '../../context';

interface IProps {
	newsItemComments: TNewsItemCommentsMain;
	handleSetIsCommentsVisible: (isCommentsVisible?: boolean) => void;
	isCommentsVisible: boolean;

	news_id: TNewsItemData['news_id'];
	comments_counter: TNewsItemData['comments_counter'];
	hit_comments_limit: TNewsItemData['hit_comments_limit'];
	comments: TNewsItemData['comments'];
}

const Comments: FC<IProps> = ({
	newsItemComments,
	handleSetIsCommentsVisible,
	isCommentsVisible,
	news_id,
	comments_counter,
	hit_comments_limit,
	comments,
}) => {
	const [
		{
			data: { user: userData, token: userToken },
		},
	] = useUserSharedState();

	const [
		{
			actions: { items: newsItemsActions },
		},
		newsDispatch,
	] = useNewsSharedState();

	const [requestsActionsState, requestsActionsDispatch] = useReducer(
		commentsRequestsReducer,
		{}
	);

	const [isCommentTextarea, setIsCommentTextarea] = useState(true);

	const getMoreMainCommentsRequest =
		newsItemsActions[news_id]?.requests?.getMoreMainComments;

	const [values, setValues] = useState({
		content: '',
	});

	const isSendCommentButtonDisable = !!(
		!userData || requestsActionsState.create?.isLoading
	);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		if (
			!userData ||
			requestsActionsState.create?.isLoading ||
			values.content.length < 2
		)
			return;

		await createNewsItemMainComment(requestsActionsDispatch, {
			token: userToken,
			bodyContent: {
				comment_type: 'comment_main',
				content: values.content,
				news_id: news_id,
			},
			newsItemExtraDataDispatch,
			requiredExtraData: {
				author_id: userData.id,
				author_user_name_id: userData.user_name_id,
				author_first_name: userData.first_name,
				author_last_name: userData.last_name,
				author_profile_picture: userData.profile_picture,
				type: 'comment_main',
			},
		});

		setValues({
			content: '',
		});
	};

	const [newsItemExtraDataSharedState, newsItemExtraDataDispatch] =
		useNewsItemExtraDataSharedState();

	const loadMoreNewsItemMainComments = useCallback(async () => {
		if (
			parseInt(comments_counter + '') === 0 ||
			hit_comments_limit ||
			!comments ||
			comments.length === 0
		)
			return;

		await getMoreNewsItemCommentsMain(requestsActionsDispatch, {
			newsItemExtraDataDispatch,
			news_id: news_id,
			urlOptions: {
				params: {
					news_id: news_id,
				},
				queries: {
					comment_type: 'comment_main',
					last_comment_created_at: new Date(
						comments[comments.length - 1].created_at
					).toISOString(),
				},
			},
		});
	}, [
		comments_counter,
		hit_comments_limit,
		comments,
		newsItemExtraDataDispatch,
		news_id,
	]);

	const handleIsUpdatingContentVisible = (isVisible?: boolean) => {
		setIsCommentTextarea((prevState) =>
			typeof isVisible === 'boolean' ? isVisible : !prevState
		);
	};

	useEffect(() => {
		if (
			parseInt(comments_counter + '') === 0 ||
			hit_comments_limit ||
			newsItemComments.length !== 0
		)
			return;
		if (
			!requestsActionsState?.initGetComments ||
			(requestsActionsState.initGetComments &&
				!requestsActionsState.initGetComments.isLoading &&
				!requestsActionsState.initGetComments.success)
		) {
			(async () =>
				await getMoreNewsItemCommentsMain(requestsActionsDispatch, {
					newsItemExtraDataDispatch,
					news_id: news_id,
					urlOptions: {
						params: {
							news_id: news_id,
						},
						queries: {
							comment_type: 'comment_main',
						},
					},
				}))();
		}
	}, [
		news_id,
		newsDispatch,
		newsItemComments.length,
		requestsActionsState.initGetComments,
		hit_comments_limit,
		comments_counter,
		newsItemExtraDataSharedState,
		newsItemExtraDataDispatch,
	]);

	return (
		<div>
			{!!(userData?.id && isCommentTextarea) && (
				<CommentTextarea
					handleSubmit={handleSubmit}
					name='content'
					setValues={setValues}
					value={values.content}
					disableSubmitButton={isSendCommentButtonDisable}
					handleIsCommentTextareaIsVisible={() =>
						handleIsUpdatingContentVisible(false)
					}
				/>
			)}
			{!!(userData?.id && !isCommentTextarea) && (
				<ButtonComponent onClick={() => handleIsUpdatingContentVisible(true)}>
					Add Comment?
				</ButtonComponent>
			)}
			<div>
				{requestsActionsState?.initGetComments?.isLoading && (
					<p className='isLoadingLoader'>Loading...</p>
				)}
				{requestsActionsState?.initGetComments?.error && (
					<p className='errorMessage'>
						{!requestsActionsState?.initGetComments.error}
					</p>
				)}
				{newsItemComments.length !== 0 &&
					newsItemComments.map((comment) => (
						<Comment
							commentType='comment_main'
							key={comment.news_comment_id}
							comment={comment}
							news_id={news_id}
						/>
					))}
			</div>
			<div className='buttons-holder'>
				{!hit_comments_limit && comments && comments.length !== 0 && (
					<button
						title='Load more comments'
						disabled={
							requestsActionsState?.initGetComments?.isLoading ||
							getMoreMainCommentsRequest?.isLoading
						}
						onClick={async () => await loadMoreNewsItemMainComments()}
					>
						<span className={helpersClasses.fontWeightBold}>Load More</span>
					</button>
				)}{' '}
				<button
					title='Hide comments'
					disabled={
						requestsActionsState?.initGetComments?.isLoading ||
						getMoreMainCommentsRequest?.isLoading
					}
				>
					<span
						className={helpersClasses.fontWeightBold}
						onClick={() => {
							if (isCommentsVisible) handleSetIsCommentsVisible(false);
						}}
					>
						Hide Comments
					</span>
				</button>
			</div>
		</div>
	);
};

export default Comments;
