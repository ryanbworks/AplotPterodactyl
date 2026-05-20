import React from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import styled, { keyframes } from 'styled-components/macro';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import NotFoundSvg from '@/assets/images/not_found.svg';
import ServerErrorSvg from '@/assets/images/server_error.svg';

interface BaseProps {
    title: string;
    image: string;
    message: string;
    onRetry?: () => void;
    onBack?: () => void;
}

interface PropsWithRetry extends BaseProps {
    onRetry?: () => void;
    onBack?: never;
}

interface PropsWithBack extends BaseProps {
    onBack?: () => void;
    onRetry?: never;
}

export type ScreenBlockProps = PropsWithBack | PropsWithRetry;

const spin = keyframes`
    to { transform: rotate(360deg) }
`;

const ActionButton = styled(Button)`
    ${tw`rounded-full w-8 h-8 flex items-center justify-center p-0`};

    &.hover\\:spin:hover {
        animation: ${spin} 2s linear infinite;
    }
`;

const ScreenBlock = ({ title, image, message, onBack, onRetry }: ScreenBlockProps) => (
    <PageContentBlock>
        <div css={tw`flex justify-center items-center min-h-[60vh]`}>
            <div
                className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-12 md:p-20 shadow-xl text-center relative max-w-2xl w-full mx-4'}
            >
                {(typeof onBack === 'function' || typeof onRetry === 'function') && (
                    <div css={tw`absolute left-0 top-0 ml-6 mt-6`}>
                        <button
                            onClick={() => (onRetry ? onRetry() : onBack ? onBack() : null)}
                            className={`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all ${onRetry ? 'hover:rotate-180 duration-500' : ''}`}
                        >
                            <FontAwesomeIcon icon={onRetry ? faSyncAlt : faArrowLeft} />
                        </button>
                    </div>
                )}
                <img src={image} css={tw`w-48 h-auto select-none mx-auto opacity-50 grayscale`} />
                <h2 className={'mt-10 text-white font-bold text-4xl uppercase tracking-tight'}>{title}</h2>
                <p className={'text-sm text-zinc-400 mt-4 leading-relaxed max-w-md mx-auto'}>{message}</p>
                <div className={'mt-10'}>
                    <button
                        onClick={() => window.location.href = '/'}
                        className={'px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all font-bold text-sm'}
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        </div>
    </PageContentBlock>
);

type ServerErrorProps = (Omit<PropsWithBack, 'image' | 'title'> | Omit<PropsWithRetry, 'image' | 'title'>) & {
    title?: string;
};

const ServerError = ({ title, ...props }: ServerErrorProps) => (
    <ScreenBlock title={title || 'Something went wrong'} image={ServerErrorSvg} {...props} />
);

const NotFound = ({ title, message, onBack }: Partial<Pick<ScreenBlockProps, 'title' | 'message' | 'onBack'>>) => (
    <ScreenBlock
        title={title || '404'}
        image={NotFoundSvg}
        message={message || 'The requested resource was not found.'}
        onBack={onBack}
    />
);

export { ServerError, NotFound };
export default ScreenBlock;
