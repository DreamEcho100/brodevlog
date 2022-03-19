import { FC, FormEvent, useCallback, useEffect, useState } from 'react';

import helpersClasses from '@styles/helpers.module.css';

import { TNewsItemCommentsMain, TNewsItemData } from '@coreLib/ts/global';
// import {
// 	handleLoadingNewsItemComments,
// 	handlePostingCommentToNewsItem,
// } from '@store/NewsContext/actions';
// import { useNewsSharedState } from '@store/NewsContext';
// import { useUserSharedState } from '@store/UserContext';
import { useUserSharedState } from '@store/UserContext';
// import { useNewsSharedState } from '@store/newsContext';

import Comment from './Comment';
import CommentTextarea from './CommentTextarea';
import { initGetNewsItemCommentsMain } from '@store/newsContext/actions/comments';
import { useNewsSharedState } from '@store/newsContext';

interface IProps {
	newsItemComments: TNewsItemCommentsMain;
	handleSetIsCommentsVisible: (isCommentsVisible?: boolean) => void;
	isCommentsVisible: boolean;
	newsItemData: TNewsItemData;
}

const Comments: FC<IProps> = ({
	newsItemComments,
	handleSetIsCommentsVisible,
	isCommentsVisible,
	newsItemData,
}) => {
	const [
		{
			data: { user: userData },
		},
		userDispatch,
	] = useUserSharedState();
	const [newsDataState, newsDataDispatch] = useNewsSharedState();

	const [
		{
			actions: { items: newsItemsActions },
		},
		newsDispatch,
	] = useNewsSharedState();

	const initGetMainComments =
		newsItemsActions[newsItemData.news_id]?.init?.getMainComments;

	useEffect(() => {
		if (
			!newsItemData.hit_comments_limit &&
			newsItemComments.length === 0 &&
			(!initGetMainComments ||
				(initGetMainComments &&
					!initGetMainComments.isLoading &&
					!initGetMainComments.success))
		) {
			(async () =>
				await initGetNewsItemCommentsMain(newsDispatch, {
					news_id: newsItemData.news_id,
					urlOptions: {
						params: {
							news_id: newsItemData.news_id,
						},
						queries: {
							comment_type: 'comment_main',
						},
					},
				}))();
		}
	}, [
		newsItemData.news_id,
		newsDispatch,
		newsItemComments.length,
		initGetMainComments,
		newsItemData.hit_comments_limit,
	]);

	// const [userData, userDispatch] = useUserSharedState();
	// const [newsDataState, newsDataDispatch] = useNewsSharedState();

	const [values, setValues] = useState({
		content: '',
	});

	const [disableSendCommentButton, setDisableSendCommentButton] =
		useState(false);

	const [loadingComments, setLoadingComments] = useState(false);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setDisableSendCommentButton(true);

		// await handlePostingCommentToNewsItem({
		// 	newsDataDispatch,
		// 	commentType: 'comment_main',
		// 	commentContent: values.content,
		// 	news_id: newsItemData.news_id,
		// 	user: userData.user,
		// 	token: userData.token,
		// });

		setValues({
			content: '',
		});

		setDisableSendCommentButton(false);
	};

	const LoadComments = useCallback(async () => {
		if (newsItemData.comments_counter === 0 || newsItemData.hit_comments_limit)
			return;

		setLoadingComments(true);

		// await handleLoadingNewsItemComments({
		// 	newsDataDispatch,
		// 	newsItem: newsItemData,
		// });

		setLoadingComments(false);
	}, [newsItemData.comments_counter, newsItemData.hit_comments_limit]);

	// useEffect(() => LoadComments(), [LoadComments]);

	return (
		<div>
			{userData?.id && (
				<CommentTextarea
					handleSubmit={handleSubmit}
					name='content'
					setValues={setValues}
					value={values.content}
					disableSubmitBtn={disableSendCommentButton}
				/>
			)}
			<div>
				{initGetMainComments?.isLoading && (
					<p className='isLoadingLoader'>Loading...</p>
				)}
				{initGetMainComments?.error && (
					<p className='errorMessage'>{!initGetMainComments.error}</p>
				)}
				{initGetMainComments &&
					!initGetMainComments.isLoading &&
					initGetMainComments.success &&
					newsItemComments.length !== 0 &&
					newsItemComments.map((comment) => (
						<Comment
							commentType='comment_main'
							key={comment.news_comment_id}
							comment={comment}
							newsItemData={newsItemData}
						/>
					))}
			</div>
			<div className='buttons-holder'>
				{!newsItemData.hit_comments_limit && (
					<button
						title='Load more comments'
						disabled={initGetMainComments?.isLoading}
						onClick={async () => await LoadComments()}
					>
						<span className={helpersClasses.fontWeightBold}>Load More</span>
					</button>
				)}{' '}
				<button title='Hide comments' disabled={initGetMainComments?.isLoading}>
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
