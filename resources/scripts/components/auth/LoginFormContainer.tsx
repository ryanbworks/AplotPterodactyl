import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
    variant?: 'default' | 'aplot';
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 700px;
    `};
`;

const AplotContainer = styled.div`
    ${tw`relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`};
`;

const AplotCard = styled.div`
    ${tw`relative overflow-hidden border shadow-xl`};
    background: rgba(24, 24, 27, 0.5);
    border-color: rgba(39, 39, 42, 0.5);
    border-radius: 1rem;
    backdrop-filter: blur(24px);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);

    label {
        ${tw`text-xs font-bold uppercase tracking-widest mb-2`};
        color: rgb(113, 113, 122);
    }

    input:not([type='checkbox']):not([type='radio']) {
        ${tw`rounded-xl text-sm transition-all duration-150`};
        background: #050505;
        border: 1px solid rgb(39, 39, 42);
        color: white;
    }

    input:not([type='checkbox']):not([type='radio']):focus {
        border-color: rgba(34, 197, 94, 0.55);
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.35), 0 0 18px rgba(34, 197, 94, 0.14);
    }

    .aplot-submit button {
        ${tw`rounded-xl border-0 font-bold normal-case tracking-normal`};
        background: rgb(34, 197, 94);
        box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
    }

    .aplot-submit button:hover:not(:disabled) {
        background: rgb(22, 163, 74);
        box-shadow: 0 0 25px rgba(34, 197, 94, 0.5);
        transform: translateY(-1px);
    }
`;

const AplotGlow = styled.div`
    ${tw`fixed rounded-full pointer-events-none`};
    filter: blur(150px);
`;

export default forwardRef<HTMLFormElement, Props>(({ title, variant = 'default', ...props }, ref) => {
    if (variant === 'aplot') {
        return (
            <AplotContainer>
                <AplotGlow
                    css={tw`top-0 left-0 w-2/5 h-2/5`}
                    style={{ background: 'rgba(34, 197, 94, 0.12)' }}
                />
                <AplotGlow
                    css={tw`bottom-0 right-0 w-1/3 h-1/3`}
                    style={{ background: 'rgba(59, 130, 246, 0.08)', filter: 'blur(120px)' }}
                />
                <Form {...props} ref={ref}>
                    <AplotCard>
                        <div css={tw`grid grid-cols-1 lg:grid-cols-5`}>
                            <div css={tw`relative p-8 sm:p-10 lg:col-span-2 border-b lg:border-b-0 lg:border-r border-neutral-800`}>
                                <div css={tw`relative z-10 flex flex-col h-full justify-between`}>
                                    <div>
                                        <div css={tw`inline-flex items-center gap-3`}>
                                            <div
                                                css={tw`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-black shadow-lg`}
                                                style={{
                                                    background: 'rgb(34, 197, 94)',
                                                    boxShadow: '0 0 28px rgba(34, 197, 94, 0.36)',
                                                }}
                                            >
                                                A
                                            </div>
                                            <div>
                                                <p css={tw`text-white text-lg font-bold leading-none`}>AplotCloud</p>
                                                <p css={tw`text-xs text-neutral-500 uppercase tracking-widest mt-1`}>
                                                    Game Panel
                                                </p>
                                            </div>
                                        </div>
                                        <h1 css={tw`text-3xl sm:text-4xl font-bold text-white mt-10`}>
                                            {title || 'Login'}
                                        </h1>
                                        <p css={tw`text-sm sm:text-base text-neutral-400 mt-3 leading-relaxed`}>
                                            Acesse sua infraestrutura com seguranca, desempenho e controle em tempo real.
                                        </p>
                                    </div>
                                    <div css={tw`grid grid-cols-2 gap-3 mt-10`}>
                                        <div css={tw`bg-black border border-neutral-800 rounded-xl p-4`}>
                                            <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>
                                                Status
                                            </p>
                                            <p css={tw`text-green-500 text-sm font-bold mt-2`}>Online</p>
                                        </div>
                                        <div css={tw`bg-black border border-neutral-800 rounded-xl p-4`}>
                                            <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>
                                                Network
                                            </p>
                                            <p css={tw`text-blue-400 text-sm font-bold mt-2`}>Low Latency</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div css={tw`relative z-10 p-8 sm:p-10 lg:col-span-3`}>
                                <FlashMessageRender css={tw`mb-4 px-1`} />
                                {props.children}
                            </div>
                        </div>
                    </AplotCard>
                </Form>
                <p css={tw`text-center text-neutral-600 text-xs mt-5`}>
                    &copy; {new Date().getFullYear()} AplotCloud. Powered by Pterodactyl.
                </p>
            </AplotContainer>
        );
    }

    return (
        <Container>
            {title && <h2 css={tw`text-3xl text-center text-neutral-100 font-medium py-4`}>{title}</h2>}
            <FlashMessageRender css={tw`mb-2 px-1`} />
            <Form {...props} ref={ref}>
                <div css={tw`md:flex w-full bg-white shadow-lg rounded-lg p-6 md:pl-0 mx-1`}>
                    <div css={tw`flex-none select-none mb-6 md:mb-0 self-center`}>
                        <img src={'/assets/svgs/pterodactyl.svg'} css={tw`block w-48 md:w-64 mx-auto`} />
                    </div>
                    <div css={tw`flex-1`}>{props.children}</div>
                </div>
            </Form>
            <p css={tw`text-center text-neutral-500 text-xs mt-4`}>
                &copy; 2015 - {new Date().getFullYear()}&nbsp;
                <a
                    rel={'noopener nofollow noreferrer'}
                    href={'https://pterodactyl.io'}
                    target={'_blank'}
                    css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
                >
                    Pterodactyl Software
                </a>
            </p>
        </Container>
    );
});
