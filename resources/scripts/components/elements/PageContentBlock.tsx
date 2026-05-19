import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <div className="bg-[#050505] min-h-screen relative overflow-x-hidden">
                {/* Global Ambient Glows */}
                <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[150px] pointer-events-none z-0" />
                <div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />

                <div className="relative z-10 pt-16">
                    <ContentContainer css={tw`my-4 sm:my-10`} className={className}>
                        {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                        {children}
                    </ContentContainer>
                    <ContentContainer css={tw`mb-4`}>
                        <p css={tw`text-center text-neutral-500 text-xs`}>
                            <a
                                rel={'noopener nofollow noreferrer'}
                                href={'https://pterodactyl.io'}
                                target={'_blank'}
                                css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
                            >
                                Pterodactyl&reg;
                            </a>
                            &nbsp;&copy; 2015 - {new Date().getFullYear()}
                        </p>
                    </ContentContainer>
                </div>
            </div>
        </CSSTransition>
    );
};

export default PageContentBlock;
