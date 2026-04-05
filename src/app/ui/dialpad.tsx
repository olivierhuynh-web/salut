'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const messageKeys = new Set(['salut', 'ça va', 'et toi ?']);
const BUBBLE_APPEAR_DURATION = 0.35;
const CHAT_MOVE_DELAY_MS = BUBBLE_APPEAR_DURATION * 1000 + 120;
const INCOMING_MESSAGE_DELAY_MS = 1000;
const SECOND_REPLY_DELAY_MS = 3000;
const THIRD_REPLY_DELAY_MS = 500;
const FOURTH_REPLY_DELAY_MS = 2000;
const INCOMING_MESSAGE_TEXT =
  'ou comment je me suis retrouvé·e bloqué·e dans la tête de deux femmes au bord de l’explosion';
const SECOND_REPLY_TEXT = 'une pièce de théâtre';
const THIRD_REPLY_TEXT = 'http://www.liendutheatre.com';
const FOURTH_REPLY_TEXT = 'ça va être bien';

const keys: { main: string; sub: string }[][] = [
  [
    { main: 'salut', sub: '' },
    { main: '2', sub: 'ABC' },
    { main: '3', sub: 'DEF' },
  ],
  [
    { main: '4', sub: 'GHI' },
    { main: 'ça va', sub: '' },
    { main: '6', sub: 'MNO' },
  ],
  [
    { main: '7', sub: 'PQRS' },
    { main: '8', sub: 'TUV' },
    { main: 'et toi ?', sub: '' },
  ],
  [
    { main: '*', sub: '' },
    { main: '0', sub: '+' },
    { main: '#', sub: '' },
  ],
];

function Bubble({ text, bubbleId }: { text: string; bubbleId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { scale: 0.4, opacity: 0, y: 10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: BUBBLE_APPEAR_DURATION,
        ease: 'back.out(1.7)',
      },
    );
  }, []);

  return (
    <div
      ref={ref}
      data-bubble-id={bubbleId}
      className='bubble-wrapper'
      style={{ transformOrigin: 'bottom center' }}
    >
      <span className='bubble-sent'>{text}</span>
    </div>
  );
}

function ReplyBubble({ text, itemId }: { text: string; itemId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { scale: 0.92, opacity: 0, y: 10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.38,
        ease: 'power3.out',
      },
    );
  }, []);

  return (
    <div
      ref={ref}
      data-chat-item-id={itemId}
      className='flex justify-start pr-12'
      style={{ transformOrigin: 'bottom left' }}
    >
      <span className='bubble-received'>{text}</span>
    </div>
  );
}

function SentChatBubble({
  text,
  itemId,
  href,
}: {
  text: string;
  itemId: string;
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { scale: 0.92, opacity: 0, y: 10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.38,
        ease: 'power3.out',
      },
    );
  }, []);

  return (
    <div
      ref={ref}
      data-chat-item-id={itemId}
      className='flex justify-end pl-12'
      style={{ transformOrigin: 'bottom right' }}
    >
      {href ? (
        <a
          href={href}
          target='_blank'
          rel='noreferrer'
          className='bubble-sent underline underline-offset-2 decoration-white/90 pointer-events-auto'
        >
          {text}
        </a>
      ) : (
        <span className='bubble-sent'>{text}</span>
      )}
    </div>
  );
}

export default function Dialpad() {
  const [number, setNumber] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [showSecondReply, setShowSecondReply] = useState(false);
  const [showThirdReply, setShowThirdReply] = useState(false);
  const [showFourthReply, setShowFourthReply] = useState(false);
  const [isAnimatingToChat, setIsAnimatingToChat] = useState(false);
  const bubblesRowRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const chatTargetsRef = useRef<HTMLDivElement>(null);
  const chatStackRef = useRef<HTMLDivElement>(null);
  const prevBubbleRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevChatItemRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const replyTimeoutRef = useRef<number | null>(null);
  const secondReplyTimeoutRef = useRef<number | null>(null);
  const thirdReplyTimeoutRef = useRef<number | null>(null);
  const fourthReplyTimeoutRef = useRef<number | null>(null);
  const animationRanRef = useRef(false);
  const MAGIC_SEQUENCE = ['salut', 'ça va', 'et toi ?'];
  const nextExpected = MAGIC_SEQUENCE[messages.length] ?? null;
  const isMagicSequence = messages.length === 3;
  const done = isAnimatingToChat || showChat;

  useLayoutEffect(() => {
    if (showChat || isAnimatingToChat) return;

    const bubbleEls = Array.from(
      bubblesRowRef.current?.querySelectorAll('.bubble-wrapper') ?? [],
    ) as HTMLDivElement[];

    const nextRects = new Map<string, DOMRect>();

    bubbleEls.forEach((el) => {
      const bubbleId = el.dataset.bubbleId;
      if (!bubbleId) return;

      const rect = el.getBoundingClientRect();
      nextRects.set(bubbleId, rect);

      const prevRect = prevBubbleRectsRef.current.get(bubbleId);
      if (!prevRect) return;

      const dx = prevRect.left - rect.left;
      const dy = prevRect.top - rect.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      gsap.killTweensOf(el);
      gsap.set(el, { x: dx, y: dy });
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.32,
        ease: 'power2.out',
        clearProps: 'x,y',
      });
    });

    prevBubbleRectsRef.current = nextRects;
  }, [messages, showChat, isAnimatingToChat]);

  useEffect(() => {
    if (!showChat) return;

    replyTimeoutRef.current = window.setTimeout(() => {
      setShowReply(true);
      replyTimeoutRef.current = null;
    }, INCOMING_MESSAGE_DELAY_MS);

    return () => {
      if (replyTimeoutRef.current) {
        window.clearTimeout(replyTimeoutRef.current);
        replyTimeoutRef.current = null;
      }
    };
  }, [showChat]);

  useEffect(() => {
    if (!showReply) return;

    secondReplyTimeoutRef.current = window.setTimeout(() => {
      setShowSecondReply(true);
      secondReplyTimeoutRef.current = null;
    }, SECOND_REPLY_DELAY_MS);

    return () => {
      if (secondReplyTimeoutRef.current) {
        window.clearTimeout(secondReplyTimeoutRef.current);
        secondReplyTimeoutRef.current = null;
      }
    };
  }, [showReply]);

  useEffect(() => {
    if (!showSecondReply) return;

    thirdReplyTimeoutRef.current = window.setTimeout(() => {
      setShowThirdReply(true);
      thirdReplyTimeoutRef.current = null;
    }, THIRD_REPLY_DELAY_MS);

    return () => {
      if (thirdReplyTimeoutRef.current) {
        window.clearTimeout(thirdReplyTimeoutRef.current);
        thirdReplyTimeoutRef.current = null;
      }
    };
  }, [showSecondReply]);

  useEffect(() => {
    if (!showThirdReply) return;

    fourthReplyTimeoutRef.current = window.setTimeout(() => {
      setShowFourthReply(true);
      fourthReplyTimeoutRef.current = null;
    }, FOURTH_REPLY_DELAY_MS);

    return () => {
      if (fourthReplyTimeoutRef.current) {
        window.clearTimeout(fourthReplyTimeoutRef.current);
        fourthReplyTimeoutRef.current = null;
      }
    };
  }, [showThirdReply]);

  useLayoutEffect(() => {
    if (!showChat) return;

    const chatItemEls = Array.from(
      chatStackRef.current?.querySelectorAll('[data-chat-item-id]') ?? [],
    ) as HTMLDivElement[];

    const nextRects = new Map<string, DOMRect>();

    chatItemEls.forEach((el) => {
      const itemId = el.dataset.chatItemId;
      if (!itemId) return;

      const rect = el.getBoundingClientRect();
      nextRects.set(itemId, rect);

      const prevRect = prevChatItemRectsRef.current.get(itemId);
      if (!prevRect) return;

      const dx = prevRect.left - rect.left;
      const dy = prevRect.top - rect.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      gsap.killTweensOf(el);
      gsap.set(el, { x: dx, y: dy });
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.48,
        ease: 'power3.out',
        clearProps: 'x,y',
      });
    });

    prevChatItemRectsRef.current = nextRects;
  }, [
    showChat,
    showReply,
    showSecondReply,
    showThirdReply,
    showFourthReply,
    messages.length,
  ]);

  useEffect(() => {
    if (!isMagicSequence || animationRanRef.current) return;

    let frame = 0;
    const timeout = window.setTimeout(() => {
      frame = requestAnimationFrame(() => {
        const bubbleEls = Array.from(
          bubblesRowRef.current?.querySelectorAll('.bubble-wrapper') ?? [],
        ) as HTMLDivElement[];
        const bubbleInnerEls = bubbleEls
          .map((el) => el.querySelector('.bubble-sent'))
          .filter(Boolean) as HTMLSpanElement[];
        const targetEls = Array.from(
          chatTargetsRef.current?.querySelectorAll('.bubble-target') ?? [],
        ) as HTMLSpanElement[];

        if (
          bubbleEls.length !== 3 ||
          bubbleInnerEls.length !== 3 ||
          targetEls.length !== 3
        )
          return;

        animationRanRef.current = true;
        setIsAnimatingToChat(true);

        const startRects = bubbleInnerEls.map((el) =>
          el.getBoundingClientRect(),
        );
        const targetRects = targetEls.map((el) => el.getBoundingClientRect());

        bubbleEls.forEach((el, i) => {
          const start = startRects[i];
          gsap.set(el, {
            position: 'fixed',
            top: start.top,
            left: start.left,
            width: 'max-content',
            height: 'auto',
            margin: 0,
            zIndex: 30,
          });
        });

        const tl = gsap.timeline({
          defaults: { duration: 0.9, ease: 'power3.out' },
          onComplete: () => {
            setShowChat(true);
            setShowBottom(false);
            setIsAnimatingToChat(false);
          },
        });

        tl.to(
          bottomRef.current,
          { opacity: 0, duration: 0.55, ease: 'power2.out' },
          0,
        );

        bubbleEls.forEach((el, i) => {
          const start = startRects[i];
          const target = targetRects[i];
          tl.to(
            el,
            {
              x: target.left - start.left,
              y: target.top - start.top,
            },
            0,
          );
        });
      });
    }, CHAT_MOVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isMagicSequence]);

  function press(key: string) {
    if (done) return;
    if (messageKeys.has(key)) {
      if (key === nextExpected) setMessages((prev) => [...prev, key]);
    } else {
      setNumber((prev) => prev + key);
    }
  }

  function backspace() {
    if (done) return;
    setNumber((prev) => prev.slice(0, -1));
  }

  return (
    <div
      ref={chatAreaRef}
      className='relative h-full flex flex-col justify-center overflow-hidden pt-16'
    >
      <div
        ref={chatTargetsRef}
        className={`pointer-events-none absolute inset-0 px-4 ${showChat ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!showChat}
      >
        <div
          ref={chatStackRef}
          className='h-full flex flex-col justify-center gap-2.5'
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              data-chat-item-id={`sent-${i}`}
              className='flex justify-end'
            >
              <span className='bubble-sent bubble-target'>{msg}</span>
            </div>
          ))}
          {showReply && (
            <ReplyBubble itemId='reply' text={INCOMING_MESSAGE_TEXT} />
          )}
          {showSecondReply && (
            <SentChatBubble itemId='reply-sent' text={SECOND_REPLY_TEXT} />
          )}
          {showThirdReply && (
            <SentChatBubble
              itemId='reply-link'
              text={THIRD_REPLY_TEXT}
              href={THIRD_REPLY_TEXT}
            />
          )}
          {showFourthReply && (
            <ReplyBubble itemId='reply-final' text={FOURTH_REPLY_TEXT} />
          )}
        </div>
      </div>

      {!showChat && (
        <div className='flex flex-col justify-end px-4 pb-4'>
          <div
            ref={bubblesRowRef}
            className={`flex flex-row flex-nowrap justify-around items-center h-12 ${isAnimatingToChat ? 'pointer-events-none' : ''}`}
          >
            {messages.map((msg, i) => (
              <Bubble key={`${msg}-${i}`} bubbleId={`${i}`} text={msg} />
            ))}
          </div>
        </div>
      )}

      {showBottom && (
        <div
          ref={bottomRef}
          className='flex flex-col items-center gap-4 px-4 pb-3 pt-4'
        >
          <div className='w-full max-w-xs flex items-center justify-between border-b border-zinc-200 pb-3'>
            <span className='text-3xl tracking-widest font-light text-zinc-800 flex-1'>
              {number}
            </span>
            {number && (
              <button
                onClick={backspace}
                className='text-zinc-400 hover:text-zinc-700 transition-colors px-2'
                aria-label='Effacer'
              >
                ⌫
              </button>
            )}
          </div>

          <div className='flex flex-col gap-3 w-full max-w-xs'>
            {keys.map((row, i) => (
              <div key={i} className='flex gap-3 justify-center'>
                {row.map((key) => (
                  <button
                    key={key.main}
                    onClick={() => press(key.main)}
                    disabled={done || (messageKeys.has(key.main) && key.main !== nextExpected)}
                    className='w-20 h-20 rounded-full flex flex-col items-center justify-center transition-colors active:bg-zinc-200'
                    style={{ background: 'rgba(120,120,128,0.12)' }}
                  >
                    <span
                      className='font-light leading-none text-zinc-900'
                      style={{
                        fontFamily: '-apple-system, sans-serif',
                        fontSize: messageKeys.has(key.main) ? '13px' : '28px',
                      }}
                    >
                      {key.main}
                    </span>
                    {key.sub && (
                      <span className='text-[10px] tracking-widest font-medium text-zinc-900 mt-0.5'>
                        {key.sub}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <button
            disabled
            className='w-20 h-20 rounded-full bg-green-500 opacity-30 cursor-not-allowed text-white text-2xl'
            aria-label='Appeler'
          >
            📞
          </button>
        </div>
      )}
    </div>
  );
}
