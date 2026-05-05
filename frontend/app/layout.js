import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';

export const metadata = {
  title: 'DRISHTI — Diabetic Retinopathy Detection',
  description: 'Hybrid ViT-CNN framework for automated DR grading',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
