import { useCallback, useEffect, useMemo, useState } from 'react'
import { LiveKitRoom, VideoConference, useRoomContext } from '@livekit/components-react'
import '@livekit/components-styles'
import { DataPacket_Kind } from 'livekit-client'
import { joinLiveClass, leaveLiveClass } from '../apis/liveClassesApi'

const RaiseHandButton = ({ disabled }) => {
  const room = useRoomContext()
  const raiseHand = useCallback(() => {
    if (!room) return
    const payload = JSON.stringify({ type: 'RAISE_HAND', at: new Date().toISOString() })
    room.localParticipant.publishData(new TextEncoder().encode(payload), DataPacket_Kind.RELIABLE)
  }, [room])

  return (
    <button type="button" className="btn btn-light border" onClick={raiseHand} disabled={disabled || !room}>
      <i className="ri-hand-heart-line me-6"></i>
      Raise Hand
    </button>
  )
}

const MeetingRoomInner = ({ role }) => {
  const room = useRoomContext()
  const canRaise = role === 'STUDENT' || role === 'PARENT'

  useEffect(() => {
    if (!room || !canRaise) return
    const onData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload)
        const msg = JSON.parse(text)
        if (msg?.type === 'RAISE_HAND') {
          // Teacher UI can be enhanced to show a proper toast/list.
          // For now, keep it minimal to avoid UI churn in the existing app.
          console.log('Raise hand:', participant?.identity, participant?.name, msg)
        }
      } catch {
        // ignore
      }
    }
    room.on('dataReceived', onData)
    return () => {
      room.off('dataReceived', onData)
    }
  }, [room, canRaise])

  return (
    <div className="d-flex gap-10 align-items-center mb-12">
      <RaiseHandButton disabled={!canRaise} />
      <span className="text-secondary-light text-sm">Role: {role}</span>
    </div>
  )
}

const MeetingRoom = ({ liveClassId, onLeave }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (!liveClassId) return
    setLoading(true)
    setError('')
    joinLiveClass(liveClassId)
      .then(setSession)
      .catch((err) => setError(err?.message || 'Failed to join live class'))
      .finally(() => setLoading(false))
  }, [liveClassId])

  const isTeacher = useMemo(() => session?.role === 'TEACHER', [session?.role])
  const initialAudio = isTeacher
  const initialVideo = isTeacher

  const handleLeave = useCallback(async () => {
    try {
      if (liveClassId) await leaveLiveClass(liveClassId)
    } catch {
      // ignore
    }
    onLeave?.()
  }, [liveClassId, onLeave])

  if (loading) return <div className="card p-24 text-secondary-light">Connecting...</div>
  if (error) return <div className="alert alert-danger py-10">{error}</div>
  if (!session?.token || !session?.wsUrl) return null

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-10 mb-12">
          <div>
            <div className="fw-semibold text-primary-light">Live Class Room</div>
            <div className="text-secondary-light text-sm">{session.roomName}</div>
          </div>
          <button type="button" className="btn btn-light border" onClick={handleLeave}>
            <i className="ri-close-line me-6"></i>
            Close
          </button>
        </div>

        <LiveKitRoom
          token={session.token}
          serverUrl={session.wsUrl}
          connect
          audio={initialAudio}
          video={initialVideo}
          onDisconnected={handleLeave}
          data-lk-theme="default"
          style={{ minHeight: 520 }}
        >
          <MeetingRoomInner role={session.role} />
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  )
}

export default MeetingRoom

