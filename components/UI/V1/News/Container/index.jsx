import { Fragment, useContext, useEffect, useState } from 'react';

import classes from './index.module.css';
import BorderClasses from '@components/UI/V1/Border.module.css';

import NewsContext from '@store/NewsContext';
import {
	handleLoadingNewsItemContent,
	HandleLoadingUserVote,
} from '@store/NewsContext/actions';
import UserContext from '@store/UserContext';
import { handleAllClasses } from '@/lib/v1/className';

import Modal from '@components/UI/V1/Modal';
import ContainerItems from './ContainerItems';
import Button from '@components/UI/V1/Button';

const Container = ({
	defaultClasses = 'container',
	extraClasses = '',
	className = '',
	detailsType = 'description',
	newsItem,
	isLoadingSkeleton,
	...props
}) => {
	const { state: userState } = useContext(UserContext);
	const { state, dispatch } = useContext(NewsContext);

	const [showModal, setShowModal] = useState(false);
	const [isLoadingUserVote, setIsLoadingUserVote] = useState(
		!!props.loadingUserVote
	);

	const articleProps = {
		className: classes['container'],
	};

	const allClasses = handleAllClasses({
		classes,
		defaultClasses,
		extraClasses,
		className,
	});

	if (newsItem?.type === 'article')
		articleProps.lang = `${newsItem.iso_language}-${newsItem.iso_country}`;

	useEffect(() => {
		if (showModal && !newsItem?.content && newsItem?.news_id) {
			handleLoadingNewsItemContent({
				dispatch,
				news_id: newsItem.news_id,
			});
		}
	}, [showModal]);

	useEffect(() => {
		if (
			isLoadingUserVote &&
			userState.userExist &&
			newsItem?.news_id &&
			(parseInt(newsItem.up_votes_counter) !== 0 ||
				parseInt(newsItem.down_votes_counter) !== 0)
		) {
			if (!isLoadingUserVote) setIsLoadingUserVote(true);
			HandleLoadingUserVote({
				dispatch,
				news_id: newsItem.news_id,
				user: userState.user,
				state,
			});
			if (isLoadingUserVote) setIsLoadingUserVote(false);
		}
	}, [isLoadingUserVote, userState.userExist]);

	return (
		<>
			<ContainerItems
				articleProps={{
					...articleProps,
					className: `${allClasses} ${articleProps.className}`,
				}}
				isLoadingSkeleton={isLoadingSkeleton}
				newsItem={newsItem}
				setShowModal={setShowModal}
				detailsType={detailsType}
				isLoadingUserVote={isLoadingUserVote}
				hideFooterSettings={props.hideFooterSettings}
			/>

			{!isLoadingSkeleton && props.modalOnClick && (
				<Modal
					showModal={showModal}
					setShowModal={setShowModal}
					click={() => setShowModal(false)}
					CloseButtonElement={(props) => (
						<Button title='Close Modal' {...props}>
							Close
						</Button>
					)}
					modelClasses={{
						'modal-wrapper': { width: '90%', maxWidth: 'none' },
						'modal-container': { background: 'var(--main-bg-color-2)' },
						'modal-body': {
							background: 'var(--main-bg-color-1)',
						},
					}}
				>
					<Fragment key='header'>{/* <Header /> */}</Fragment>
					<Fragment key='body'>
						<ContainerItems
							className={`${BorderClasses['border-2']}`}
							articleProps={articleProps}
							newsItem={newsItem}
							setShowModal={setShowModal}
							detailsType='content'
							hideFooterSettings={props.hideFooterSettings}
						/>
					</Fragment>
				</Modal>
			)}
		</>
	);
};

export default Container;
