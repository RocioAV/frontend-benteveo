import { useState, useCallback } from 'react'
import ReceiveObjectModal from './ReceiveObjectModal'
import RatingModal from './RatingModal'

function RentalCompletionFlow({ objectName, action = 'received', onCompleted, isOpen = false }) {
  const [step, setStep] = useState('receive')

  const handleConfirmReceived = useCallback(() => {
    setStep('rating')
  }, [])

  const handleSkipRating = useCallback(() => {
    setStep('receive')
    onCompleted?.({ skipped: true })
  }, [onCompleted])

  const handleSubmitRating = useCallback(({ rating, comment }) => {
    setStep('receive')
    onCompleted?.({ rating, comment, skipped: false })
  }, [onCompleted])

  const handleClose = useCallback(() => {
    setStep('receive')
    onCompleted?.({ cancelled: true })
  }, [onCompleted])

  return (
    <>
      <ReceiveObjectModal
        isOpen={isOpen && step === 'receive'}
        onClose={handleClose}
        onConfirm={handleConfirmReceived}
        objectName={objectName}
        action={action}
      />
      <RatingModal
        isOpen={isOpen && step === 'rating'}
        onClose={handleSkipRating}
        onSubmit={handleSubmitRating}
        objectName={objectName}
      />
    </>
  )
}

export default RentalCompletionFlow
