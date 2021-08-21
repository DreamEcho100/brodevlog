// import classes from './index.module.css';

import Wrapper from '@components/UI/V1/Wrapper';
import NewsHeader from '@components/UI/V1/News/Header/Header';
import Details from '@components/UI/V1/News/Details/Details';
import NewsFooter from '@components/UI/V1/News/Footer';

const ContainerItems = ({
	articleProps = {},
	newsItem,
	setData = () => {},
	detailsType,
	setShowModal,
	setIsLoadingContent,
	isLoadingContent,
	isLoadingUserVote,
	// props.hideHeaderSettings,
	...props
}) => {
	return (
		<Wrapper
			style={{
				width: '100%',
				maxWidth: '100rem',
				marginLeft: 'auto',
				marginRight: 'auto',
			}}
			extraClasses='full-width'
		>
			<article {...articleProps}>
				<NewsHeader
					newsItem={newsItem}
					setData={setData}
					setShowModal={setShowModal}
					hideHeaderSettings={props.hideHeaderSettings}
					setIsLoadingContent={setIsLoadingContent}
					isLoadingContent={isLoadingContent}
				/>
				<Details
					newsItem={newsItem}
					setData={setData}
					detailsType={detailsType}
					setShowModal={setShowModal}
					isLoadingContent={isLoadingContent}
				/>
				<NewsFooter
					newsItem={newsItem}
					setData={setData}
					isLoadingUserVote={isLoadingUserVote}
				/>
			</article>
		</Wrapper>
	);
};

export default ContainerItems;
