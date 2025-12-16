import { Fragment } from 'react'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { 
  HomeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { name: 'Documents', to: '/documents', icon: DocumentTextIcon },
  { name: 'Settings', to: '/settings', icon: Cog6ToothIcon },
  { name: 'Help', to: '/help', icon: QuestionMarkCircleIcon },
  { name: 'Privacy', to: '/privacy', icon: ShieldCheckIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <Fragment>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      <div
        className={classNames(
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-gray-900 transition duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0'
        )}
      >
        <div className="flex h-16 flex-shrink-0 items-center bg-gray-900 px-4">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">AutoRAG</span>
          </div>
          <div className="ml-auto lg:hidden">
            <button
              type="button"
              className="-mr-3 flex h-10 w-10 items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav className="mt-5 space-y-1 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  'group flex items-center rounded-md px-2 py-2 text-base font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={classNames(
                      isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                      'mr-4 h-6 w-6 flex-shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
          <div className="absolute bottom-0 w-full border-t border-gray-800 p-4">
            <button
              type="button"
              onClick={() => {
                toast.success('Signed out (demo)')
                onClose?.()
              }}
              className="group flex w-full items-center rounded-md px-2 py-2 text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeftOnRectangleIcon
                className="mr-4 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                aria-hidden="true"
              />
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </Fragment>
  )
}