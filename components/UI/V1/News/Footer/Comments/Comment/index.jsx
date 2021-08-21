import { useContext, useEffect, useState } from 'react';
// import dynamic from 'next/dynamic';

import classes from './index.module.css';

import UserContext from '@store/UserContext';
import { dateToHumanReadableDate } from '@lib/v1/time';

// const DynamicDropdownMenu = dynamic(() =>
// 	import('@components/UI/V1/DropdownMenu')
// );

import DropdownMenu from '@components/UI/V1/DropdownMenu';
import CommentTextarea from '../CommentTextarea';
import Image from '@components/UI/V1/Image';

const Replies = ({ replies, setData, newsItem, parent_data }) =>
	replies
		? replies.map((reply) => (
				<Comment
					key={reply.news_comment_id}
					comment={reply}
					setData={setData}
					newsItem={newsItem}
					parent_data={parent_data}
				/>
		  ))
		: null;

const Comment = ({ comment, newsItem, setData, ...props }) => {
	const { user, ...UserCxt } = useContext(UserContext);

	const [showContent, setShowContent] = useState(true);
	const [showReplyTextarea, setShowReplyTextarea] = useState(false);
	const [showReplies, setShowReplies] = useState(false);

	// useEffect(() => {
	// }, [])

	const [focusTextarea, setFocusCommentTextarea] = useState(false);
	const [editBtnsDisabled, setEditBtnsDisabled] = useState(false);

	const [deleteBtnsDisabled, setDeleteBtnsDisabled] = useState(false);
	const [commentReplyBtnsDisabled, setCommentReplyBtnsDisabled] =
		useState(false);
	const [focusCommentReplyTextarea, setFocusCommentReplyTextarea] =
		useState(false);

	const [loadingReplies, setLoadingReplies] = useState(false);
	const [hitRepliesLimit, setHitRepliesLimit] = useState(
		comment.type === 'comment_main' && comment.hit_replies_limit
			? comment.hit_replies_limit
			: false
	);

	const [values, setValues] = useState({
		content: comment.content,
		comment_reply: '',
	});
	const [items, setItems] = useState([]);

	const handleDeleteComment = async (bodyObj) => {
		setDeleteBtnsDisabled(true);

		const body = JSON.stringify(bodyObj);

		const {
			status,
			message,
			data: comment,
		} = await fetch('/api/v1/news/comments/comment', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				authorization: `Bearer ${user.token}`,
			},
			body,
		})
			.then((response) => response.json())
			.catch((error) => {
				return { ...error, status: 'error' };
			});

		if (status === 'error') {
			console.error(message);
			setDeleteBtnsDisabled(false);
			return;
		}

		if (bodyObj.type === 'comment_main') {
			setData((prev) => ({
				...prev,
				comments_counter: prev.comments_counter - 1,
				comments: prev.comments.filter(
					(comment) => comment.news_comment_id !== bodyObj.news_comment_id
				),
			}));
		} else if (bodyObj.type === 'comment_main_reply') {
			setData((prev) => ({
				...prev,
				comments: prev.comments.map((comment) => {
					if (comment.news_comment_id === bodyObj.parent_id) {
						let replies = comment.replies.filter(
							(reply) => reply.news_comment_id !== bodyObj.news_comment_id
						);

						return {
							...comment,
							replies_counter: comment.replies_counter - 1,
							replies,
						};
					}
					return comment;
				}),
			}));
		}
	};

	const handleUpdatingComment = async (event) => {
		event.preventDefault();
		setEditBtnsDisabled(true);

		const bodyObj = {
			// type: comment.type,
			content: values.content,
			news_comment_id: comment.news_comment_id,
		};

		const { status, message, newsItem } = await fetch(
			'/api/v1/news/comments/comment',
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify(bodyObj),
			}
		)
			.then((response) => response.json())
			.catch((error) => {
				return { ...error, status: 'error' };
			});

		if (status === 'error') {
			console.error(message);
			setEditBtnsDisabled(false);
			return;
		}

		if (comment.type === 'comment_main') {
			setData((prev) => ({
				...prev,
				comments: prev.comments.map((comment) => {
					if (comment.news_comment_id === bodyObj.news_comment_id) {
						return {
							...comment,
							content: bodyObj.content,
							updated_on: new Date().toUTCString(),
						};
					}
					return comment;
				}),
			}));
		} else if (comment.type === 'comment_main_reply') {
			setData((prev) => ({
				...prev,
				comments: prev.comments.map((comment) => {
					if (comment.news_comment_id === props.parent_data.news_comment_id) {
						return {
							...comment,
							replies: comment.replies.map((reply) => {
								if (reply.news_comment_id === bodyObj.news_comment_id) {
									return {
										...reply,
										content: bodyObj.content,
										updated_on: new Date().toUTCString(),
									};
								}
								return reply;
							}),
						};
					}
					return comment;
				}),
			}));
		}

		setShowContent(true);
		setEditBtnsDisabled(false);
	};

	const handleSubmitCommentReply = async (
		bodyObj,
		user,
		commentData,
		setData,
		setValues
	) => {
		setCommentReplyBtnsDisabled(true);

		const { status, message, newsItem } = await fetch(
			'/api/v1/news/comments/comment',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify(bodyObj),
			}
		)
			.then((response) => response.json())
			.catch((error) => {
				return { ...error, status: 'error' };
			});

		if (status === 'error') {
			console.error(message);
			setCommentReplyBtnsDisabled(false);
			return;
		}

		const commentReplyObj = {
			...bodyObj,

			author_first_name: user.first_name,
			author_last_name: user.last_name,
			author_profile_picture: user.profile_picture,
			author_user_name_id: user.user_name_id,

			author_id: user.id,
			news_comment_id: newsItem.news_comment_id,
			created_at: new Date().toUTCString(),
			updated_on: new Date().toUTCString(),
		};

		setData((prev) => ({
			...prev,
			comments: prev.comments.map((comment) => {
				if (comment.news_comment_id === bodyObj.parent_id) {
					// const replies = comment.replies
					// 	? [...comment.replies, commentReplyObj]
					// 	: [commentReplyObj];

					let replies = comment.replies || [];

					// if (bodyObj.reply_to_comment_id) {
					// 	replies = replies.map((reply) => {
					// 		if (reply.news_id === bodyObj.reply_to_comment_id) {
					// 			return {
					// 				...reply,
					// 				comments_counter: reply.comments_counter + 1,
					// 			};
					// 		}
					// 		return reply;
					// 	});
					// }

					replies.push(commentReplyObj);

					return {
						...comment,
						replies_counter: comment.replies_counter + 1,
						replies_to_not_fetch: prev.replies_to_not_fetch
							? [...prev.replies_to_not_fetch, commentReplyObj.news_comment_id]
							: [commentReplyObj.news_comment_id],
						replies,
					};
				}

				return comment;
			}),
		}));

		setValues((prev) => ({
			...prev,
			comment_reply: '',
		}));

		setShowReplyTextarea(false);
		setCommentReplyBtnsDisabled(false);
	};

	const loadRepliesHandler = async (parent_id) => {
		if (comment.replies && comment.replies.length === comment.replies_counter)
			return;
		setLoadingReplies(true);

		let fetchInput = `/api/v1/news/comments/comment/?type=comment_main_reply&parent_id=${parent_id}`;

		if (comment.last_reply_created_at) {
			fetchInput += `&last_reply_created_at=${comment.last_reply_created_at}`;
		}

		if (
			comment.replies_to_not_fetch &&
			comment.replies_to_not_fetch.length > 0
		) {
			fetchInput += `&replies_to_not_fetch=${comment.replies_to_not_fetch.join(
				','
			)}`;
		}

		const { status, message, newsItem } = await fetch(fetchInput).then(
			(response) => response.json()
		);

		if (status === 'error') {
			setLoadingReplies(false);
			return console.error(message);
		}

		setData((prev) => ({
			...prev,
			comments: prev.comments.map((comment) => {
				if (comment.news_comment_id === parent_id) {
					const last_reply_created_at =
						newsItem.comments[newsItem.comments.length - 1].created_at;

					const replies = comment.replies
						? [...comment.replies, ...newsItem.comments /*.reverse()*/]
						: newsItem.comments; /*.reverse()*/

					return {
						...comment,
						replies,
						hit_replies_limit: newsItem.hit_replies_limit,
						last_reply_created_at,
					};
				}

				return comment;
			}),
		}));

		if (newsItem.hit_replies_limit && !hitRepliesLimit)
			setHitRepliesLimit(true);
		if (!showReplies) setShowReplies(true);

		setLoadingReplies(false);
	};

	useEffect(() => {
		if (UserCxt.userExist) {
			setItems([
				{
					props: {
						handleDeleteComment,
						comment,
						newsItem,
						deleteBtnsDisabled,
					},
					Element: ({
						handleDeleteComment,
						comment,
						newsItem,
						deleteBtnsDisabled,
					}) => (
						<button
							title='Delete Comment'
							disabled={deleteBtnsDisabled}
							onClick={() => {
								let bodyObj = {};
								if (comment.type === 'comment_main') {
									bodyObj = {
										type: comment.type,
										news_comment_id: comment.news_comment_id,
										parent_id: newsItem.news_id,
									};
								} else if (comment.type === 'comment_main_reply') {
									bodyObj = {
										type: comment.type,
										news_comment_id: comment.news_comment_id,
										parent_id: props.parent_data.news_comment_id,
									};

									if (comment.reply_to_comment_id)
										bodyObj.reply_to_comment_id = comment.reply_to_comment_id;
								}

								handleDeleteComment(bodyObj);
							}}
						>
							Delete
						</button>
					),
				},
				{
					props: {
						setShowContent,
						setFocusCommentTextarea,
					},
					Element: ({ setShowContent, setFocusCommentTextarea }) => (
						<button
							title='Edit Comment'
							onClick={() => {
								setShowContent(false);
								setFocusCommentTextarea(true);
							}}
						>
							Edit
						</button>
					),
				},
			]);
		} else {
			if (items.length > 0) setItems([]);
		}
	}, [UserCxt.userExist]);

	useEffect(() => {
		if (
			comment.type === 'comment_main' &&
			!showReplies &&
			comment.replies &&
			comment.replies.length !== 0
		) {
			setShowReplies(true);
		}
	}, []);

	return (
		<div className={`${classes.comment} ${classes[`type-${comment.type}`]}`}>
			<header className={classes.header}>
				<nav className={classes.nav}>
					<Image
						className={classes.profile_picture}
						src={comment.author_profile_picture}
						alt=''
					/>
					<div className={classes['author-info']}>
						<p className={classes.author_name}>
							{comment.author_first_name} {comment.author_last_name}
						</p>
						<p className={classes.user_name_id}>
							{comment.author_user_name_id}
						</p>
					</div>
				</nav>
				{user.id === comment.author_id && showContent && (
					<DropdownMenu
						// DynamicDropdownMenu
						items={items}
					/>
				)}
			</header>
			{showContent && (
				<main className={classes.main}>
					<p>{comment.content}</p>
				</main>
			)}
			{!showContent && (
				<CommentTextarea
					type='update'
					handleSubmit={handleUpdatingComment}
					focusTextarea={focusTextarea}
					setFocusCommentTextarea={setFocusCommentTextarea}
					name='content'
					comment={comment}
					setValues={setValues}
					value={values.content}
					disableSubmitBtn={editBtnsDisabled}
					closeBtn
					onClickingCloseBtn={() => setShowContent(true)}
				/>
			)}
			<footer className={classes.footer}>
				<p>
					<span>
						<small>
							<strong>Created At:</strong>{' '}
							<em>
								{
									dateToHumanReadableDate(comment.created_at, {
										withTime: true,
									}).dateAndTimeString
								}
							</em>
						</small>
					</span>
					{comment.created_at !== comment.updated_on && (
						<span>
							<small>
								, <strong>Updated On:</strong>{' '}
								<em>
									{
										dateToHumanReadableDate(comment.updated_on, {
											withTime: true,
										}).dateAndTimeString
									}
								</em>
							</small>
						</span>
					)}
				</p>
				<button
					title='Reply To A Comment'
					title='Comment'
					onClick={() => setShowReplyTextarea((prev) => !prev)}
				>
					Reply
				</button>
			</footer>
			{comment.type === 'comment_main' &&
				comment.replies_counter !== 0 &&
				!showReplies && (
					// !hitRepliesLimit &&
					<button
						title={`${comment.replies_counter === 1 ? 'Reply' : 'Replies'} ${
							comment.replies_counter
						}`}
						disabled={loadingReplies}
						onClick={() => {
							if (comment.replies && comment.replies.length !== 0)
								setShowReplies(true);
							if (
								(comment.replies &&
									comment.replies.length !== comment.replies_counter) ||
								!comment.hitRepliesLimit
							) {
								loadRepliesHandler(comment.news_comment_id, setData);
							} else {
								if (hitRepliesLimit) setHitRepliesLimit(true);
							}
						}}
					>
						<p>
							{comment.replies_counter === 1 ? 'Reply' : 'Replies'}{' '}
							{comment.replies_counter}
						</p>
					</button>
				)}
			{showReplyTextarea && (
				<CommentTextarea
					handleSubmit={(event) => {
						event.preventDefault();

						let bodyObj = {
							type: 'comment_main_reply',
							news_id: newsItem.news_id,
							content: values.comment_reply,
							// reply_to_comment_id: null, // comment.news_id,
							reply_to_user_id: comment.author_id,
						};

						if (comment.type === 'comment_main') {
							bodyObj.parent_id = comment.news_comment_id;
						} else if (comment.type === 'comment_main_reply') {
							bodyObj.parent_id = props.parent_data.news_comment_id;
							bodyObj.reply_to_comment_id = comment.news_comment_id;
						}

						handleSubmitCommentReply(
							bodyObj,
							user,
							comment,
							setData,
							setValues
						);
					}}
					focusTextarea={focusCommentReplyTextarea}
					setFocusCommentTextarea={setFocusCommentReplyTextarea}
					name='comment_reply'
					setValues={setValues}
					value={values.comment_reply}
					disableSubmitBtn={commentReplyBtnsDisabled}
					closeBtn
					onClickingCloseBtn={() => setShowReplyTextarea(false)}
				/>
			)}
			{showReplies && (
				<Replies
					replies={comment.replies}
					setData={setData}
					newsItem={newsItem}
					parent_data={comment}
				/>
			)}

			{loadingReplies && <p>Loading...</p>}

			{showReplies &&
				comment.type === 'comment_main' &&
				!hitRepliesLimit &&
				comment.replies_counter !== 0 && (
					<button
						title='Load More'
						disabled={loadingReplies}
						onClick={() => {
							if (comment.replies && comment.replies.length !== 0)
								setShowReplies(true);
							if (
								(comment.replies &&
									comment.replies.length !== comment.replies_counter) ||
								!comment.hitRepliesLimit
							) {
								loadRepliesHandler(comment.news_comment_id, setData);
							} else {
								if (hitRepliesLimit) setHitRepliesLimit(true);
							}
						}}
					>
						Load More
					</button>
				)}

			{showReplies && (
				<button
					title='Hide Replies'
					disabled={loadingReplies}
					onClick={() => setShowReplies(false)}
				>
					Hide Replies
				</button>
			)}
		</div>
	);
};

export default Comment;
