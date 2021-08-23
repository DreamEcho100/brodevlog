import { useContext, useEffect, useState } from 'react';

// import classes from './index.module.css';

import {
	handleLoadingNewsItemComments,
	handlePostingCommentToNewsItem,
} from '@store/NewsContextTest/actions';
import NewsContextTest from '@store/NewsContextTest';
import UserContext from '@store/UserContext';
// import NewsContext from '@store/NewsContext';

import Comment from './Comment';
import CommentTextarea from './CommentTextarea';

const Comments = ({
	inheritedClasses,
	// data,
	// setData,
	comments,
	setNews = () => {},
	className,
	newsItem,
	setShowComments,
	setFocusCommentTextarea,
	showComments,
	focusCommentTextarea,
}) => {
	const { user /* , ...UserCxt*/ } = useContext(UserContext);
	const { dispatch } = useContext(NewsContextTest);
	// const { news, setNews } = useContext(NewsContext);

	const [values, setValues] = useState({
		content: '',
	});

	const [disableSendCommentButton, setDisableSendCommentButton] =
		useState(false);

	const [loadingComments, setLoadingComments] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();

		setDisableSendCommentButton(true);

		await handlePostingCommentToNewsItem({
			dispatch,
			commentType: 'comment_main',
			commentContent: values.content,
			news_id: newsItem.news_id,
			user,
		});

		setValues({
			content: '',
		});

		setDisableSendCommentButton(false);
	};

	const LoadComments = async () => {
		if (newsItem.comments_counter === 0 || newsItem.hit_comments_limit) return;

		setLoadingComments(true);

		await handleLoadingNewsItemComments({ dispatch, newsItem });

		setLoadingComments(false);
	};

	useEffect(() => LoadComments(), []);

	return (
		<section className={`${inheritedClasses}`}>
			<CommentTextarea
				handleSubmit={handleSubmit}
				focusTextarea={focusCommentTextarea}
				setFocusCommentTextarea={setFocusCommentTextarea}
				name='content'
				setValues={setValues}
				value={values.content}
				disableSubmitBtn={disableSendCommentButton}
			/>
			<div>
				{newsItem.comments &&
					newsItem.comments.map((comment, index) => (
						<Comment
							key={comment.news_comment_id}
							comment={comment}
							setData={setNews}
							newsItem={newsItem}
						/>
					))}
			</div>
			{loadingComments && <p>Loading...</p>}
			<div>
				{!newsItem.hit_comments_limit && (
					<button
						title='Load More'
						disabled={loadingComments}
						onClick={async () => await LoadComments()}
					>
						<h3>Load More</h3>
					</button>
				)}
				<button title='Hide Comments' disabled={loadingComments}>
					<h3
						onClick={() => {
							if (showComments) setShowComments(false);
							if (focusCommentTextarea) setFocusCommentTextarea(false);
						}}
					>
						Hide Comments
					</h3>
				</button>
			</div>
		</section>
	);
};

export default Comments;
